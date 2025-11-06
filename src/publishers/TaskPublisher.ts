import { IMessengerProvider } from "../providers/messaging/IMessengerProvider";

export interface EventBase<T = unknown> {
  type: "task.error";
  correlationId: string;
  userId: string;
  data?: T;
  error?: { code: string; message: string };
  occurredAt: string;
}

const EVENT_ROUTES = {
  error: "task.error",
} as const;

export class TaskPublisher {
  constructor(private readonly messaging: IMessengerProvider) {}

  async taskError(evt: EventBase): Promise<void> {
    try {
      await this.messaging.publish(EVENT_ROUTES.error, evt);
      console.log(`[TaskPublisher] Evento de erro publicado: ${evt.correlationId}`);
    } catch (err) {
      console.error(`[TaskPublisher] Falha ao publicar erro: ${evt.correlationId}`, err);
    }
  }
}
