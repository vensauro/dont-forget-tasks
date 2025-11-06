import { IMessengerProvider } from "./IMessengerProvider";
import { RabbitMQProvider } from "./RabbitMQProvider";
import { RabbitMQProviderFake } from "./RabbitMQProviderFake";

export class MessengerProviderFactory {
  static create(useFake: boolean): IMessengerProvider {
    return useFake ? new RabbitMQProviderFake() : new RabbitMQProvider();
  }
}
