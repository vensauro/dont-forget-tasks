import { IRabbitMQProvider } from "./IRabbitMQProvider";
import { RabbitMQProvider } from "./RabbitMQProvider";
import { RabbitMQProviderFake } from "./RabbitMQProviderFake";

export class RabbitMQProviderFactory {
  static create(useFake: boolean): IRabbitMQProvider {
    return useFake ? new RabbitMQProviderFake() : new RabbitMQProvider();
  }
}
