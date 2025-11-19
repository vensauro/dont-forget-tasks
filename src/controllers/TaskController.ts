import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";

export class TaskController {
  private service: TaskService;
  constructor() {
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

      const tasks = await this.service.listTasks(userId);

      return res.status(200).json({
        Type: "task.listed",
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
