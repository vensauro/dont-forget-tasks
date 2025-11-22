import { ITaskRepository } from "../repositories/ITaskRepository";
import { ICategoryRepository } from "../repositories/ICategoryRepository";
import { Task } from "../models/Task";

export class TaskService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async createTask(data: {
    description: string;
    userId: string;
    expiredAt: string;
    categoryId: number;
  }): Promise<Task> {
    const category = await this.categoryRepository.findById(data.userId, data.categoryId);
    if (!category) throw new Error("Categoria inexistente.");
    const task = new Task(
      data.description,
      data.userId,
      data.expiredAt,
      data.categoryId
    );
    return await this.taskRepository.save(task);
  }

  async listTasks(userId: string, categoryId?: number) {
    const tasks = await this.taskRepository.findAll(userId, categoryId);
    if (categoryId) {
      return {
        categoryId,
        tasks
      };
    }
    const grouped: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!grouped[t.CategoryId]) grouped[t.CategoryId] = [];
      grouped[t.CategoryId].push(t);
    }

    return grouped;
  }

  async deleteTask(userId: string, taskId: number): Promise<void> {
    await this.taskRepository.delete(userId, taskId);
  }

  async getTask(taskId: number, userId: string): Promise<Task | null> {
    return this.taskRepository.findById(taskId, userId);
  }
}
