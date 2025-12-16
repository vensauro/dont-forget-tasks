import { ITaskRepository } from "../repositories/ITaskRepository";
import { ICategoryRepository } from "../repositories/ICategoryRepository";
import { Task, TaskWithId } from "../models/Task";

export class TaskService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly categoryRepository: ICategoryRepository
  ) { }

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

  async updateTask(
    userId: string,
    taskId: number,
    data: {
      description?: string;
      expiredAt?: string;
      categoryId?: number;
    }
  ): Promise<Task> {
    const task = await this.getTask(taskId, userId) as TaskWithId;
    if (!task) throw new Error("Task não encontrada");
    if (data.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(
        userId,
        data.categoryId
      );
      if (!category) throw new Error("Categoria inexistente");
      task.CategoryId = data.categoryId;
    }
    if (data.description !== undefined) {
      task.Description = data.description;
    }
    if (data.expiredAt !== undefined) {
      task.ExpiredAt = data.expiredAt;
    }
    return await this.taskRepository.update(task);
  }
}
