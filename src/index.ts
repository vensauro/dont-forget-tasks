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

  private async initRabbit() {
    await this.messengerProvider.init();
    await TaskConsumer.init(this.messengerProvider);
    console.log("📡 RabbitMQ conectado e consumers iniciados.");

    // Se estiver usando Fake e quiser seed manual
    if (
      process.env.USE_RABBIT === "false" &&
      process.env.SEED_FAKE_MESSAGES === "true" &&
      typeof (this.messengerProvider as any).seedMessage === "function"
    ) {
      console.log("💡 Enviando mensagem fake inicial...");
      await (this.messengerProvider as any).seedMessage("task_queue", {
        type: "task.create",
        correlationId: "ci89a526-fab3-48cf-9771-1b993e9578c7",
        userId: "db89a526-fab3-48cf-9771-1b993e9578c9",
        payload: {
          description: "Não esqueça de criar a primeira task!",
          userId: "db89a526-fab3-48cf-9771-1b993e9578c9",
          timestamp: 1758678484365,
        }
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
      await this.initRabbit();

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
