import { IRabbitMQProvider } from "../providers/rabbitmq/IRabbitMQProvider";

export class UserConsumer {
  static async init(rabbitProvider: IRabbitMQProvider) {
    const queueName = "user_queue";

    await rabbitProvider.consume(queueName, (msg: any) => {
      console.log(`[UserConsumer] Mensagem recebida:`, msg);

      // UserService.handleEvent(msg);
    });

    console.log(`[UserConsumer] Consumer inicializado na fila "${queueName}"`);
  }
}
