import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskPublisher } from "../publishers/TaskPublisher";
import { RabbitMQProvider } from "../providers/rabbitmq/RabbitMQProvider";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";

export class TaskController {
  private service: TaskService;
  private publisher: TaskPublisher;

  constructor() {
    const rabbitProvider = new RabbitMQProvider();
    this.publisher = new TaskPublisher(rabbitProvider);

    const taskRepository = TaskRepositoryFactory.create();
    this.service = new TaskService(taskRepository);
  }

  health = (req: Request, res: Response) => {
    return res.status(200).json(true);
  };

  createTask = async (req: Request, res: Response) => {
    try {
      const { description, userId, timestamp } = req.body;
      if (!description || !userId || !timestamp) {
        return res.status(400).json({ error: "description, userId e timestamp são obrigatórios" });
      }

      const task = await this.service.createTask({ description, userId, timestamp });

      // await this.publisher.taskCreated(task);

      res.status(201).json(task);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
}
