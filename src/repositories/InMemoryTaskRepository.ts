import { Task } from "../models/Task";
import { ITaskRepository } from "./ITaskRepository";

export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Record<string, Task[]> = {};
  private counters: Record<string, number> = {};

  async save(task: Task): Promise<Task> {
    if (!this.counters[task.UserId]) {
      this.counters[task.UserId] = 0;
    }
    const newId = ++this.counters[task.UserId];
    task.Id = newId;
    if (!this.tasks[task.UserId]) {
      this.tasks[task.UserId] = [];
    }
    this.tasks[task.UserId].push(task);
    return task;
  }

  async findAll(userId: string, categoryId?: number): Promise<Task[]> {
    const list = this.tasks[userId] || [];
    if (!categoryId) return list;
    return list.filter(t => t.CategoryId === categoryId);
  }

  async delete(userId: string, taskId: number): Promise<void> {
    const userTasks = this.tasks[userId];
    if (!userTasks) return;
    this.tasks[userId] = userTasks.filter(t => t.Id !== taskId);
  }

  async findById(taskId: number, userId: string): Promise<Task | null> {
    const userTasks = this.tasks[userId];
    if (!userTasks) return null;
    return userTasks.find(t => t.Id === taskId) || null;
  }

  async update(task: Task & { Id: number }): Promise<Task> {
    const userTasks = this.tasks[task.UserId];
    if (!userTasks) throw new Error("Task não encontrada");
    const index = userTasks.findIndex(t => t.Id === task.Id);
    if (index === -1) throw new Error("Task não encontrada");
    userTasks[index] = task;
    return task;
  }
}
