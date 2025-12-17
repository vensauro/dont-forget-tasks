import { Request, Response } from "express";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryService } from "../services/CategoryService";
import { createSender } from "../utils/Response";

function parseRequiredNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export class CategoryController {
  private service: CategoryService;

  private constructor(service: CategoryService) {
    this.service = service;
  }

  static async create(): Promise<CategoryController> {
    const categoryRepository = await CategoryRepositoryFactory.create();
    const taskRepository = await TaskRepositoryFactory.create();

    const service = new CategoryService(
      categoryRepository,
      taskRepository
    );

    return new CategoryController(service);
  }

  health = (_: Request, res: Response) => {
    return res.status(200).json(true);
  };

  listCategories = async (req: Request, res: Response) => {
    const send = createSender(res);

    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }

      const categories = await this.service.listCategories(userId);

      return send.response(categories, {
        Type: "category.listed",
        UserId: userId,
        OccurredAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };

  getCategory = async (req: Request, res: Response) => {
    const send = createSender(res);

    try {
      const userId = req.user?.user_id;
      const categoryId = parseRequiredNumber(req.params.id);

      if (!userId || categoryId === null) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }

      const category = await this.service.getCategory(userId, categoryId);

      if (!category) {
        return send.notFound({}, { Message: "Categoria não encontrada" });
      }

      return send.response(category, {
        Type: "category.get",
        UserId: userId,
        OccurredAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };
}
