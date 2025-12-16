import { Category } from "../models/Category";
import { ICategoryRepository } from "./ICategoryRepository";

export class InMemoryCategoryRepository implements ICategoryRepository {
  private categories: Record<string, Category[]> = {};
  private counters: Record<string, number> = {};

  private categoryTasks: Record<string, Record<number, number[]>> = {};

  async save(userId: string, name: string): Promise<Category> {
    if (!this.counters[userId]) {
      this.counters[userId] = 0;
    }
    const newId = ++this.counters[userId];
    const category: Category = {
      Id: newId,
      UserId: userId,
      Name: name,
    };
    if (!this.categories[userId]) {
      this.categories[userId] = [];
    }
    this.categories[userId].push(category);
    return category;
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.categories[userId] || [];
  }

  async findById(userId: string, categoryId: number): Promise<Category | null> {
    const list = this.categories[userId];
    if (!list) return null;
    return list.find(c => c.Id === categoryId) || null;
  }

  async delete(userId: string, categoryId: number): Promise<void> {
    const list = this.categories[userId];
    if (!list) return;
    this.categories[userId] = list.filter(c => c.Id !== categoryId);
    if (this.categoryTasks[userId]?.[categoryId]) {
      delete this.categoryTasks[userId][categoryId];
    }
  }

  addTaskToCategory(userId: string, categoryId: number, taskId: number) {
    if (!this.categoryTasks[userId]) {
      this.categoryTasks[userId] = {};
    }
    if (!this.categoryTasks[userId][categoryId]) {
      this.categoryTasks[userId][categoryId] = [];
    }
    this.categoryTasks[userId][categoryId].push(taskId);
  }

  getTasksForCategory(userId: string, categoryId: number): number[] {
    return this.categoryTasks[userId]?.[categoryId] || [];
  }

  async update(category: Category & { Id: number }): Promise<Category> {
    const list = this.categories[category.UserId];
    if (!list) throw new Error("Categoria não encontrada");
    const index = list.findIndex(c => c.Id === category.Id);
    if (index === -1) throw new Error("Categoria não encontrada");
    list[index] = category;
    return category;
  }
}
