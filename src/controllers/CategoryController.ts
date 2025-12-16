import { Request, Response } from "express";
import { CategoryRepositoryFactory } from "../repositories/CategoryRepositoryFactory";
import { TaskRepositoryFactory } from "../repositories/TaskRepositoryFactory";
import { CategoryService } from "../services/CategoryService";
import { createSender } from "../utils/Response";

export class CategoryController {
  private service: CategoryService;
  constructor() {
      const taskRepository = TaskRepositoryFactory.create();
      const categoryRepository = CategoryRepositoryFactory.create();
      this.service = new CategoryService(categoryRepository, taskRepository);
  }

  health = (res: Response) => res.status(200).json(true);

  listCategories = async (req: Request, res: Response) => {
    const send = createSender(res);
    try {
      const userId = req.user!.user_id;
      if (!userId) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }
      const categories = await this.service.listCategories(userId);
      return send.response(
        categories,
        {
          Type: "category.listed",
          UserId: userId,
          OccurredAt: new Date().toISOString()
        }
      );
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };

  getCategory = async (req: Request, res: Response) => {
    const send = createSender(res);
    try {
      const userId = req.user!.user_id;
      const categoryId = req.params.id as string;
      if (!categoryId || !userId) {
        return send.badRequest({}, { Message: "Todos os campos são obrigatórios" });
      }
      const category = await this.service.getCategory(userId, parseInt(categoryId, 10));
      if (!category) {
        return send.notFound({}, { Message: "Categoria não encontrada" });
      }
      return send.response(
        category,
        {
          Type: "category.get",
          UserId: userId,
          OccurredAt: new Date().toISOString()
        }
      );
    } catch (error: any) {
      console.error(error);
      return send.serverError({}, { Error: error.message });
    }
  };
}
