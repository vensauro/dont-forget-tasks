import app from "./app";
import { env } from "./config/env";
import { TaskConsumer } from "./consumers/TaskConsumer";
import { MessengerProviderFactory } from "./providers/messenger/MessengerProviderFactory";

class Application {
  private readonly messengerProvider: ReturnType<typeof MessengerProviderFactory.create>;
  private readonly port: number;

  constructor() {
    const useFake = process.env.USE_RABBIT === "false";
    this.messengerProvider = MessengerProviderFactory.create(useFake);
    this.port = env.port;
  }

  private async initMessenger() {
    await this.messengerProvider.init();
    await TaskConsumer.init(this.messengerProvider);
    console.log("📡 Mensageiro (RabbitMQ) conectado e consumers iniciados.");

    // Se estiver usando Fake e quiser seed manual
    if (
      process.env.USE_RABBIT === "false" &&
      process.env.SEED_FAKE_MESSAGES === "true" &&
      typeof (this.messengerProvider as any).seedMessage === "function"
    ) {
      console.log("💡 Enviando mensagem fake inicial...");
      await (this.messengerProvider as any).seedMessage("task_queue", {
        Type: "category.create",
        CorrelationId: "ci89a526-fab3-48cf-9771-1b993e9578c6",
        Data: {
          UserId: "db89a526-fab3-48cf-9771-1b993e9578c9",
          Name: "Faculdade"
        },
        OccurredAt: "2025-11-22T18:30:00.000Z"
      });
      await (this.messengerProvider as any).seedMessage("task_queue", {
        Type: "task.create",
        CorrelationId: "ci89a526-fab3-48cf-9771-1b993e9578c7",
        Data: {
          Description: "Não esqueça de criar a primeira task!",
          CategoryId: 1,
          ExpiredAt: "2025-12-18T18:30:00.000Z",
          UserId: "db89a526-fab3-48cf-9771-1b993e9578c9",
          DeviceToken: "123456789"
        },
        OccurredAt: "2025-11-22T18:30:00.000Z"
      });
    }
  }

  private initHttp() {
    app.listen(this.port, () => {
      console.log(`🚀 HTTP Server rodando na porta ${this.port}`);
    });
  }

  public async start() {
    try {
      await this.initMessenger();
      if (process.env.ENABLE_HTTP === "true") {
        this.initHttp();
      }
      console.log("✅ Aplicação iniciada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao iniciar a aplicação:", error);
      process.exit(1);
    }
  }
}

const application = new Application();
application.start();
