import { Request, Response } from "express";
import { TaskService } from "../services/TaskService";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { createSender } from "../utils/Response";

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function parseRequiredNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export class TaskController {
  private service: TaskService;

  private constructor(service: TaskService) {
    this.service = service;
  }

  /**
   * Factory assíncrona para criação do controller
   * (necessário por causa do Redis / IO)
   */
  static async create(): Promise<TaskController> {
    const taskRepository = await TaskRepositoryFactory.create();
    const categoryRepository = await CategoryRepositoryFactory.create();

    const service = new TaskService(
      taskRepository,
      categoryRepository
    );

    return new TaskController(service);
  }

  health = (_: Request, res: Response) => {
    return res.status(200).json(true);
  };

  listTasks = async (req: Request, res: Response) => {
    const send = createSender(res);

    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return send.badRequest({}, { Message: "Campo para consulta é obrigatório" });
      }

      const categoryId = parseOptionalNumber(req.query.categoryId);

      const tasks = await this.service.listTasks(userId, categoryId);

      return send.response(tasks, {
        Type: "task.listed",
        UserId: userId,
        OccurredAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };

  getTask = async (req: Request, res: Response) => {
    const send = createSender(res);

    try {
      const userId = req.user?.user_id;
      const taskId = parseRequiredNumber(req.params.id);

      if (!userId || taskId === null) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }

      const task = await this.service.getTask(taskId, userId);

      if (!task) {
        return send.notFound({}, { Message: "Task não encontrada" });
      }

      return send.response(task, {
        Type: "task.get",
        UserId: userId,
        OccurredAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };
}
