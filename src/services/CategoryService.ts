import { Category, CategoryWithId } from "../models/Category";
import { ICategoryRepository } from "../repositories/ICategoryRepository";
import { ITaskRepository } from "../repositories/ITaskRepository";

export class CategoryService {
  constructor(
    private categoryRepository: ICategoryRepository,
    private taskRepository: ITaskRepository
  ) {}

  async createCategory(data: {
    userId: string, name: string
  }) {
    return this.categoryRepository.save(data.userId, data.name);
  }

  async listCategories(userId: string) {
    return this.categoryRepository.findAll(userId);
  }

  async deleteCategory(userId: string, categoryId: number) {
    const tasks = await this.taskRepository.findAll(userId, categoryId);
    for (const task of tasks) {
      await this.taskRepository.delete(userId, task.Id!);
    }
    await this.categoryRepository.delete(userId, categoryId);
  }

  async getCategory(userId: string, categoryId: number): Promise<Category | null> {
    return this.categoryRepository.findById(userId, categoryId);
  }

  async updateCategory(
    userId: string,
    categoryId: number,
    data: {
      name?: string;
    }
  ): Promise<Category> {
    const category = await this.getCategory(userId, categoryId) as CategoryWithId;
    if (!category || category.Id === undefined) throw new Error("Categoria não encontrada");
    if (data.name !== undefined) {
      category.Name = data.name;
    }
    return this.categoryRepository.update(category);
  }
}
