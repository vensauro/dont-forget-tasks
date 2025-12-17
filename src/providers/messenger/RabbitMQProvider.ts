import * as amqp from "amqplib";
import { Connection, Channel, ConsumeMessage } from "amqplib";
import { env } from "../../config/env";
import { IMessengerProvider } from "./IMessengerProvider";

export class RabbitMQProvider implements IMessengerProvider {
  private connection!: Connection;
  private publishChannel!: Channel;

  public async init(): Promise<void> {
    try {
      this.connection = await amqp.connect(env.rabbitUrl);
      this.publishChannel = await this.connection.createChannel();

      const prefetch = Number(process.env.RABBIT_PREFETCH ?? "10");
      await this.publishChannel.prefetch(prefetch);

      console.log(`✅ RabbitMQ conectado!`);
    } catch (err) {
      console.error("❌ Erro ao inicializar RabbitMQ:", err);
      throw err;
    }
  }

  private ensureInitialized(): void {
    if (!this.connection) throw new Error("RabbitMQ Connection não inicializada!");
    if (!this.publishChannel) throw new Error("RabbitMQ publish Channel não inicializado!");
  }

  public getChannel(): Channel {
    this.ensureInitialized();
    return this.publishChannel;
  }

  public async publish(queue: string, message: object): Promise<void> {
    this.ensureInitialized();
    const ch = this.publishChannel;

    await ch.assertQueue(queue, { durable: true });

    const ok = ch.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: "application/json",
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
    this.ensureInitialized();

    const ch = await this.connection.createChannel();

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

    const perConsumerPrefetch = Number(process.env.RABBIT_PREFETCH_PER_CONSUMER ?? process.env.RABBIT_PREFETCH ?? "1");
    if (perConsumerPrefetch > 0) {
      await ch.prefetch(perConsumerPrefetch);
    }

    await ch.consume(
      queue,
      async (raw: ConsumeMessage | null) => {
        if (!raw) return;

        try {
          const contentType = raw.properties.contentType || "application/json";
          const body = raw.content.toString("utf8");
          const payload = contentType.includes("json") ? JSON.parse(body) : body;

          await Promise.resolve(callback(payload));

          ch.ack(raw);
        } catch (err) {
          console.error(`❌ [RabbitMQ] Erro processando "${queue}":`, err);
          ch.nack(raw, false, false);
        }
      },
      { noAck: false }
    );

    console.log(`Consumer ligado na fila "${queue}"`);
  }

  public async close(): Promise<void> {
    try {
      if (this.publishChannel) {
        await this.publishChannel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log("RabbitMQ desconectado.");
    } catch (err) {
      console.error("Erro ao fechar conexão do RabbitMQ:", err);
    }
  }
}
