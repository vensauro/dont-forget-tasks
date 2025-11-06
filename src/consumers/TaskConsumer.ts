import { IRabbitMQProvider } from "../providers/messaging/IRabbitMQProvider";
import { TaskService } from "../services/TaskService";
import { TaskPublisher } from "../publishers/TaskPublisher";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";

interface CreatePayload {
  description: string;
  createdAt: string; // ISO timestamp
}

interface DeletePayload {
  taskId: number | string;
}

export class TaskConsumer {
  static async init(rabbit: IRabbitMQProvider): Promise<void> {
    const queueName = "task_queue";

    const repository = TaskRepositoryFactory.create();
    const service = new TaskService(repository);
    const publisher = new TaskPublisher(rabbit);

    await rabbit.consume(queueName, async (envelope: any) => {
      try {
        // Pega apenas o conteúdo da mensagem
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
          throw new Error("Comando inválido: falta type/userId/data");
        }

        switch (type) {
          case "task.create": {
            const payload = data as CreatePayload;
            if (!payload.description || !payload.createdAt) {
              throw new Error("Payload inválido para task.create");
            }
            await service.createTask({
              description: payload.description,
              userId,
              createdAt: payload.createdAt,
            });
            console.log(`[TaskConsumer] Tarefa criada com sucesso (user=${userId})`);
            break;
          }

          case "task.delete": {
            const payload = data as DeletePayload;
            if (!payload.taskId) {
              throw new Error("Payload inválido para task.delete");
            }
            await service.deleteTask(userId, Number(payload.taskId));
            console.log(`[TaskConsumer] Tarefa ${payload.taskId} removida (user=${userId})`);
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

    console.log(`[TaskConsumer] ✅ Consumer inicializado na fila "${queueName}"`);
  }
}
