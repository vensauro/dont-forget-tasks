import { IRabbitMQProvider } from "./IRabbitMQProvider";

export class RabbitMQProviderFake implements IRabbitMQProvider {
  private channel: any;

  async init() {
    console.log("✅ RabbitMQ FAKE inicializado!");
    this.channel = {}; // apenas para getChannel()
  }

  getChannel() {
    if (!this.channel) throw new Error("RabbitMQ FAKE não inicializado!");
    return this.channel;
  }

  async publish(queue: string, message: object) {
    console.log(`[FAKE] Publicando na fila "${queue}":`, message);
  }

  async consume(queue: string, callback: (msg: any) => void) {
    console.log(`[FAKE] Consumindo fila "${queue}"...`);
    setTimeout(() => {
      callback({ id: 1, name: "Teste Fake" });
    }, 1000);
  }
}
