import { IMessengerProvider } from "../providers/messenger/IMessengerProvider";
import { TaskService } from "../services/TaskService";
import { TaskPublisher } from "../publishers/TaskPublisher";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";

interface CreatePayload {
  Description: string;
  ExpiredAt: string;
  CategoryId: number;
}

interface DeletePayload {
  TaskId: number | string;
}

export class TaskConsumer {
  static async init(messenger: IMessengerProvider): Promise<void> {
    const queueName = "task_queue";

    const taskRepository = TaskRepositoryFactory.create();
    const categoryRepository = CategoryRepositoryFactory.create();
    const service = new TaskService(taskRepository, categoryRepository);
    const publisher = new TaskPublisher(messenger);

    await messenger.consume(queueName, async (envelope: any) => {
      try {
        const cmd = envelope?.message;
        if (!cmd) {
          console.warn("[TaskConsumer] Envelope sem mensagem:", envelope);
          return;
        }

        const type = cmd.type;
        const userId = cmd.userId;
        const correlationId = cmd.correlationId ?? "unknown";
        const data = cmd.data;

        console.log(`[TaskConsumer] Recebido: ${type} (cid=${correlationId}, user=${userId})`);
        console.log("[TaskConsumer] Payload:", data);

        if (!type || !userId || !data) {
          throw new Error("Comando inválido");
        }

        switch (type) {
          case "task.create": {
            const payload = data as CreatePayload;
            if (!payload.Description || !payload.ExpiredAt) {
              throw new Error("Payload inválido para task.create");
            }
            await service.createTask({
              description: payload.Description,
              userId,
              expiredAt: payload.ExpiredAt,
              categoryId: payload.CategoryId
            });
            console.log(`[TaskConsumer] Tarefa criada com sucesso (user=${userId})`);
            break;
          }

          case "task.delete": {
            const payload = data as DeletePayload;
            if (!payload.TaskId) {
              throw new Error("Payload inválido para task.delete");
            }
            await service.deleteTask(userId, Number(payload.TaskId));
            console.log(`[TaskConsumer] Tarefa ${payload.TaskId} removida (user=${userId})`);
            break;
          }

          default:
            console.warn(`[TaskConsumer] Tipo de comando não suportado: ${type}`);
            break;
        }
      } catch (err: any) {
        const message = err?.message ?? String(err);
        console.error(`[TaskConsumer] Erro processando comando: ${message}`);
        try {
          await publisher.taskError({
            type: "task.error",
            correlationId: err?.correlationId ?? "unknown",
            userId: err?.userId ?? "unknown",
            error: { code: "TASK_ERROR", message },
            occurredAt: new Date().toISOString(),
          });
        } catch (pubErr) {
          console.error("[TaskConsumer] Falha ao publicar evento de erro:", pubErr);
        }
      }
    });
    console.log(`[TaskConsumer] Consumer inicializado na fila "${queueName}"`);
  }
}
