import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";
import { TaskService } from "../services/TaskService";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";

export class TaskConsumer {
  static async init(messenger: IMessengerProvider): Promise<void> {
    const queueName = "task_queue";
    console.log(`[TaskConsumer] init() chamado para fila "${queueName}"`);

    const taskRepository = await TaskRepositoryFactory.create();
    const categoryRepository = await CategoryRepositoryFactory.create();
    const service = new TaskService(taskRepository, categoryRepository);

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

        console.log(`[TaskConsumer] Recebido: ${type} (cid=${correlationId})`);
        console.log("[TaskConsumer] Payload:", data);

        if (!type || !data) {
          throw new Error("Comando inválido (Type/Data ausentes)");
        }

        switch (type) {
          case "task.create": {
            if (!data.description || !data.expiredAt) {
              throw new Error("Payload inválido para task.create");
            }

            await service.createTask({
              description: data.description,
              userId: data.userId,
              expiredAt: data.expiredAt,
              categoryId: data.categoryId,
            });

            console.log(
              `[TaskConsumer] Tarefa criada com sucesso (user=${data.userId})`
            );
            break;
          }

          case "task.update": {
            if (!data.taskId || !data.userId) {
              throw new Error("Payload inválido para task.update");
            }

            await service.updateTask(
              data.userId,
              Number(data.taskId),
              {
                description: data.description,
                expiredAt: data.expiredAt,
                categoryId: data.categoryId,
              }
            );

            console.log(
              `[TaskConsumer] Tarefa ${data.taskId} atualizada (user=${data.userId})`
            );
            break;
          }

          case "task.delete": {
            if (!data.taskId) {
              throw new Error("Payload inválido para task.delete");
            }

            await service.deleteTask(data.userId, Number(data.taskId));

            console.log(
              `[TaskConsumer] Tarefa ${data.taskId} removida (user=${data.userId})`
            );
            break;
          }

          default:
            console.warn(
              `[TaskConsumer] Tipo de comando não suportado: ${type}`
            );
            break;
        }
      } catch (err: any) {
        console.error(`[TaskConsumer] Erro: ${err.message}`);
      }
    });

    console.log(
      `[TaskConsumer] Consumer inicializado na fila "${queueName}"`
    );
  }
}
