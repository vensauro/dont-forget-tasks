import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";
import { CategoryPublisher } from "../publishers/CategoryPublisher";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryService } from "../services/CategoryService";

interface CreatePayload {
  Name: string;
}

interface DeletePayload {
  CategoryId: number | string;
}

export class CategoryConsumer {
  static async init(messenger: IMessengerProvider): Promise<void> {
    const queueName = "category_queue";

    const categoryRepo = CategoryRepositoryFactory.create();
    const taskRepo = TaskRepositoryFactory.create();
    const service = new CategoryService(categoryRepo, taskRepo);
    const publisher = new CategoryPublisher(messenger);

    await messenger.consume(queueName, async (envelope: any) => {
      try {
        const cmd = envelope?.message;
        if (!cmd) return;

        const { type, userId, data } = cmd;

        switch (type) {
          case "category.create": {
            const payload = data as CreatePayload; 
            await service.createCategory({
              userId, 
              name: payload.Name
            });
            break;
          }

          case "category.delete": {
            const payload = data as DeletePayload;
            await service.deleteCategory(userId, Number(payload.CategoryId));
            break;
          }

          default:
            console.warn(`[CategoryConsumer] Tipo de comando não suportado: ${type}`);
            break;
        }
      } catch (err: any) {
        const message = err?.message ?? String(err);
        console.error(`[CategoryConsumer] Erro processando comando: ${message}`);
        try {
          await publisher.categoryError({
            type: "category.error",
            correlationId: err?.correlationId ?? "unknown",
            userId: err?.userId ?? "unknown",
            error: { code: "CATEGORY_ERROR", message },
            occurredAt: new Date().toISOString(),
          });
        } catch (pubErr) {
          console.error("[CategoryConsumer] Falha ao publicar evento de erro:", pubErr);
        }
      }
    });
    console.log(`[CategoryConsumer] Consumer inicializado: ${queueName}`);
  }
}
