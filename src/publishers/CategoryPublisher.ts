import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";

export interface EventBase<T = unknown> {
  Type: "category.error";
  CorrelationId: string;
  UserId: string;
  Data?: T;
  Error?: { code: string; message: string };
  OccurredAt: string;
}

const EVENT_ROUTES = {
  error: "category.error",
} as const;

export class CategoryPublisher {
  constructor(private readonly messaging: IMessengerProvider) {}

  async categoryError(evt: EventBase): Promise<void> {
    try {
      await this.messaging.publish(EVENT_ROUTES.error, evt);
      console.log(`[CategoryPublisher] Evento de erro publicado: ${evt.CorrelationId}`);
    } catch (err) {
      console.error(`[CategoryPublisher] Falha ao publicar erro: ${evt.CorrelationId}`, err);
    }
  }
}
