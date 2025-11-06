import { IRabbitMQProvider } from "./IRabbitMQProvider";

export class RabbitMQProviderFake implements IRabbitMQProvider {
  private channel: any;
  private consumers: { [queue: string]: (msg: any) => void } = {};

  async init() {
    console.log("✅ RabbitMQ FAKE inicializado!");
    this.channel = {};
  }

  getChannel() {
    if (!this.channel) throw new Error("RabbitMQ FAKE não inicializado!");
    return this.channel;
  }

  async publish(queue: string, message: object) {
    console.log(`[FAKE] Publicando na fila "${queue}":`, message);

    if (this.consumers[queue]) {
      this.consumers[queue](message);
    }
  }

  async consume(queue: string, callback: (msg: any) => void) {
    console.log(`[FAKE] Consumindo fila "${queue}"...`);
    this.consumers[queue] = callback;
  }

  async seedMessage(queue: string, message: object) {
    if (this.consumers[queue]) {
      this.consumers[queue](message);
    } else {
      console.warn(`[FAKE] Nenhum consumidor registrado para fila "${queue}"`);
    }
  }
}
