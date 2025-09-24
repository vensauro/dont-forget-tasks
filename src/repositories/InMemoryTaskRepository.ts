import { Task } from "../models/Task";
import { ITaskRepository } from "./ITaskRepository";

export class InMemoryTaskRepository implements ITaskRepository {
  private globalCounter = 0;
  private tasks: { [taskId: number]: Task } = {};
  private userTasks: { [userId: string]: number[] } = {};

  async save(task: Task): Promise<Task> {
    const id = ++this.globalCounter;
    task.id = id;
    this.tasks[id] = task;

    if (!this.userTasks[task.userId]) this.userTasks[task.userId] = [];

    const arr = this.userTasks[task.userId];
    const idx = arr.findIndex((taskId) => this.tasks[taskId].dateTime.getTime() > task.dateTime.getTime());
    if (idx === -1) arr.push(id);
    else arr.splice(idx, 0, id);

    return task;
  }

  async findAll(userId: string, from?: number, to?: number): Promise<Task[]> {
    const taskIds = this.userTasks[userId] || [];
    let items = taskIds.map((id) => this.tasks[id]);

    if (from !== undefined) items = items.filter((t) => t.dateTime.getTime() >= from);
    if (to !== undefined) items = items.filter((t) => t.dateTime.getTime() <= to);

    return items;
  }

  async delete(userId: string, taskId: number): Promise<void> {
    delete this.tasks[taskId];
    if (this.userTasks[userId]) {
      this.userTasks[userId] = this.userTasks[userId].filter((id) => id !== taskId);
    }
  }

  async findById(taskId: number): Promise<Task | null> {
    return this.tasks[taskId] || null;
  }
}
