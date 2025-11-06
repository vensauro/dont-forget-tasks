import amqp, { Connection, Channel, ConsumeMessage } from "amqplib";
import { ChannelModel } from 'amqplib';
import { env } from "../../config/env";
import { IRabbitMQProvider } from "./IRabbitMQProvider";

export class RabbitMQProvider implements IRabbitMQProvider {
  private connection!: ChannelModel;
  private channel!: Channel;

  public async init(): Promise<void> {
    this.connection = await amqp.connect(env.rabbitUrl);
    this.channel = await this.connection.createChannel();
    const prefetch = Number(process.env.RABBIT_PREFETCH ?? "10");
    this.channel.prefetch(prefetch);
    console.log(`✅ RabbitMQ conectado! (prefetch=${prefetch})`);
  }

  public getChannel(): any {
    if (!this.channel) throw new Error("RabbitMQ não inicializado!");
    return this.channel;
  }

  public async publish(queue: string, message: object): Promise<void> {
    const ch = this.getChannel();

    await ch.assertQueue(queue, { durable: true });

    const ok = ch.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,                // Mantém mensagem no disco
        contentType: "application/json", // Ajuda no parse do consumer
      }
    );

    if (!ok) {
      console.warn(`[RabbitMQ] backpressure ao publicar em ${queue}`);
    }
  }

  public async consume(
    queue: string,
    callback: (msg: any) => void
  ): Promise<void> {
    const ch = this.getChannel();

    // DLX opcional sem quebrar nada (ligue via env se quiser DLQ)
    const useDLX = process.env.RABBIT_USE_DLX === "true";
    const dlxName = process.env.RABBIT_DLX_NAME || "events.dlx";
    if (useDLX) {
      await ch.assertExchange(dlxName, "topic", { durable: true });
    }

    await ch.assertQueue(queue, {
      durable: true,
      ...(useDLX && {
        deadLetterExchange: dlxName,
        deadLetterRoutingKey: `${queue}.dead`,
      }),
    });

    await ch.consume(
      queue,
      async (raw: ConsumeMessage | null) => {
        if (!raw) return;

        try {
          const contentType = raw.properties.contentType || "application/json";
          const body = raw.content.toString("utf8");
          const payload = contentType.includes("json") ? JSON.parse(body) : body;

          // Suporta callback sync (tipado) e async (em runtime)
          await Promise.resolve((callback as unknown as (m: any) => any)(payload));

          ch.ack(raw);
        } catch (err) {
          console.error(`[RabbitMQ] erro processando "${queue}":`, err);
          // Evita loop infinito; se DLX estiver ligado, vai para a DLQ
          ch.nack(raw, false, false);
        }
      },
      { noAck: false }
    );
    console.log(`📥 Consumer ligado na fila "${queue}"`);
  }

  public async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
