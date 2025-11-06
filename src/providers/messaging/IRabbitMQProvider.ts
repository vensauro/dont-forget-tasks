export interface IRabbitMQProvider {
  init(): Promise<void>;
  getChannel(): any;
  publish(queue: string, message: object): Promise<void>;
  consume(queue: string, callback: (msg: any) => void): Promise<void>;
}
