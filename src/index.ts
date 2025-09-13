import app from "./app";
import { env } from "./config/env";
import { UserConsumer } from "./consumers/UserConsumer";
import { RabbitMQProviderFactory } from "./providers/rabbitmq/RabbitMQProviderFactory";

const useFake = process.env.USE_FAKE_RABBIT === "true";
const rabbitProvider = RabbitMQProviderFactory.create(useFake);

async function bootstrap() {
  await rabbitProvider.init();
  await UserConsumer.init(rabbitProvider);

  app.listen(env.port, () => {
    console.log(`🚀 Server rodando na porta ${env.port}`);
  });
}

bootstrap();
