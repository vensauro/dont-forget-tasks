import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { createSender } from "../utils/Response";

export class TaskController {
  private service: TaskService;
  constructor() {
    const taskRepository = TaskRepositoryFactory.create();
    const categoryRepository = CategoryRepositoryFactory.create();
    this.service = new TaskService(taskRepository, categoryRepository);
  }

  health = (res: Response) => res.status(200).json(true);

  listTasks = async (req: Request, res: Response) => {
    const send = createSender(res);
    try {
      const categoryId = req.query!!.categoryId && 
        typeof req.query.categoryId == 'string' ? parseInt(req.query.categoryId) : undefined;
      const userId = req.user!.user_id;
      if (!userId) {
        return send.badRequest({}, { Message: "Campo para consulta é obrigatório" });
      }
      const tasks = await this.service.listTasks(userId, categoryId);
      return send.response(
        tasks,
        {
          Type: "task.listed",
          UserId: userId,
          OccurredAt: new Date().toISOString(),
        }
      );
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };

  getTask = async (req: Request, res: Response) => {
    const send = createSender(res);
    try {
      const userId = req.user!.user_id;
      const taskId = req.params.id as string;
      if (!taskId || !userId) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }
      const task = await this.service.getTask(parseInt(taskId), userId);
      if (!task) {
        return send.notFound({}, { Message: "Task não encontrada" });
      }
      return send.response(
        task,
        {
          Type: "task.get",
          UserId: userId,
          OccurredAt: new Date().toISOString(),
        }
      );
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };
}
