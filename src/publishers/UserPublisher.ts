import { RabbitMQProvider } from "../providers/rabbitmq/RabbitMQProvider";

export class UserPublisher {
  static async userCreated(user: any) {
    await RabbitMQProvider.publish("user_created", user);
  }
}
