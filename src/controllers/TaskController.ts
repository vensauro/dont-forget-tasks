import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskPublisher } from "../publishers/TaskPublisher";
import { RabbitMQProvider } from "../providers/messenger/RabbitMQProvider";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { MessengerProviderFactory } from "../providers/messenger/MessengerProviderFactory";

interface BaseEvent<T> {
  Type: string;
  CorrelationId: string;
  UserId: string;
  Data: T;
  OccurredAt: string;
}

interface TaskCreateData {
  Description: string;
  CreatedAt: string; // ISO
}

// interface ListTaskData {
//   From?: string;
//   To?: string;
// }

export class TaskController {
  private service: TaskService;
  private publisher: TaskPublisher;

  constructor() {
    const messengerProvider = MessengerProviderFactory.create(true);
    this.publisher = new TaskPublisher(messengerProvider);

    const taskRepository = TaskRepositoryFactory.create();
    this.service = new TaskService(taskRepository);
  }

  health = (req: Request, res: Response) => res.status(200).json(true);

  listTasks = async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({ error: "UserId é obrigatório" });
      }

      // const from = event.Data?.From ? new Date(event.Data.From).getTime() : undefined;
      // const to = event.Data?.To ? new Date(event.Data.To).getTime() : undefined;

      const tasks = await this.service.listTasks(userId);

      return res.status(200).json({
        Type: "task.listed",
        // CorrelationId: event.CorrelationId,
        UserId: userId,
        OccurredAt: new Date().toISOString(),
        Data: tasks
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  };

  getTask = async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const taskId = req.query.taskId as string;

      if (!taskId || !userId) {
        return res.status(400).json({ error: "UserId e TaskId são obrigatórios" });
      }

      const task = await this.service.getTask(parseInt(taskId), userId);

      if (!task) {
        return res.status(404).json({ error: "Task não encontrada" });
      }

      return res.status(200).json({
        Type: "task.get",
        // CorrelationId: event.CorrelationId,
        UserId: userId,
        OccurredAt: new Date().toISOString(),
        Data: task
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  };
}
