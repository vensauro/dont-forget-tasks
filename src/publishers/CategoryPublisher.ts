import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";

export interface EventBase<T = unknown> {
  type: "category.error";
  correlationId: string;
  userId: string;
  data?: T;
  error?: { code: string; message: string };
  occurredAt: string;
}

const EVENT_ROUTES = {
  error: "category.error",
} as const;

export class CategoryPublisher {
  constructor(private readonly messaging: IMessengerProvider) {}

  async categoryError(evt: EventBase): Promise<void> {
    try {
      await this.messaging.publish(EVENT_ROUTES.error, evt);
      console.log(`[CategoryPublisher] Evento de erro publicado: ${evt.correlationId}`);
    } catch (err) {
      console.error(`[CategoryPublisher] Falha ao publicar erro: ${evt.correlationId}`, err);
    }
  }
}
