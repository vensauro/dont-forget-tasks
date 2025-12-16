import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryService } from "../services/CategoryService";

export class CategoryConsumer {
  static async init(messenger: IMessengerProvider): Promise<void> {
    const queueName = "category_queue";
    console.log(`[CategoryConsumer] init() chamado para fila "${queueName}"`);

    const categoryRepo = CategoryRepositoryFactory.create();
    const taskRepo = TaskRepositoryFactory.create();
    const service = new CategoryService(categoryRepo, taskRepo);

    await messenger.consume(queueName, async (envelope: any) => {
      try {
        console.log("RAW ENVELOPE:", JSON.stringify(envelope, null, 2));

        const inner =
          envelope.message ||
          envelope.Message ||
          envelope;

        const type =
          inner.Type || inner.type || null;

        const data =
          inner.Data || inner.data || null;

        const correlationId =
          envelope.correlationId ||
          envelope.CorrelationId ||
          inner.correlationId ||
          inner.CorrelationId ||
          "unknown";

        console.log(`[CategoryConsumer] Recebido: ${type} (cid=${correlationId})`);
        console.log("[CategoryConsumer] Payload:", data);

        if (!type || !data) {
          throw new Error("Comando inválido (sem Type ou Data)");
        }

        switch (type) {
          case "category.create": {
            await service.createCategory({
              userId: data.userId,
              name: data.name,
            });

            console.log(
              `[CategoryConsumer] Categoria criada (user=${data.userId})`
            );
            break;
          }

          case "category.update": {
            if (!data.categoryId || !data.userId) {
              throw new Error("Payload inválido para category.update");
            }

            await service.updateCategory(
              data.userId,
              Number(data.categoryId),
              {
                name: data.name,
              }
            );

            console.log(
              `[CategoryConsumer] Categoria ${data.categoryId} atualizada (user=${data.userId})`
            );
            break;
          }

          case "category.delete": {
            if (!data.categoryId) {
              throw new Error("Payload inválido para category.delete");
            }

            await service.deleteCategory(data.userId, Number(data.categoryId));

            console.log(
              `[CategoryConsumer] Categoria removida (id=${data.categoryId}, user=${data.userId})`
            );
            break;
          }

          default:
            console.warn(
              `[CategoryConsumer] Tipo de comando não suportado: ${type}`
            );
            break;
        }
      } catch (err: any) {
        console.error(`[CategoryConsumer] Erro: ${err.message}`);
      }
    });

    console.log(`[CategoryConsumer] Consumer inicializado na fila ${queueName}`);
  }
}
