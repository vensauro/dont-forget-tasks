import amqp from "amqplib";
import { env } from "../../config/env";
import { IRabbitMQProvider } from "./IRabbitMQProvider";

export class RabbitMQProvider implements IRabbitMQProvider {
  // private connection: { createChannel: () => any; };
  private connection: any;
  private channel: any;

  async init() {
    this.connection = await amqp.connect(env.rabbitUrl);
    this.channel = await this.connection.createChannel();
    console.log("✅ RabbitMQ conectado!");
  }

  getChannel() {
    if (!this.channel) throw new Error("RabbitMQ não inicializado!");
    return this.channel;
  }

  async publish(queue: string, message: object) {
    const channel = this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async consume(queue: string, callback: (msg: any) => void) {
    const channel = this.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.consume(queue, (msg: { content: { toString: () => string; }; }) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      }
    });
  }
}
