import { createClient, RedisClientType } from "redis";
import { ITaskRepository } from "./ITaskRepository";
import { Task } from "../models/Task";

export class RedisTaskRepository implements ITaskRepository {
  private static client: RedisClientType | null = null;
  private client: RedisClientType;

  constructor() {
    if (!RedisTaskRepository.client) {
      RedisTaskRepository.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });

      RedisTaskRepository.client.on("error", (err: any) => {
        console.error("❌ Erro no Redis:", err);
      });
    }
    this.client = RedisTaskRepository.client!;
  }

  private async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("📦 Redis conectado com sucesso!");
    }
  }

  private counterKey(userId: string) {
    return `tasks:${userId}:counter`;
  }

  private userTasksKey(userId: string) {
    return `tasks:${userId}`;
  }

  private taskKey(userId: string, taskId: number) {
    return `task:${userId}:${taskId}`;
  }

  private categoryTasksKey(userId: string, categoryId: number) {
    return `category:${userId}:${categoryId}:tasks`;
  }

  async save(task: Task): Promise<Task> {
    await this.connect();
    const id = await this.client.incr(this.counterKey(task.UserId));
    task.Id = id;
    await this.client.hSet(this.taskKey(task.UserId, id), {
      Id: id.toString(),
      UserId: task.UserId,
      Description: task.Description,
      ExpiredAt: task.ExpiredAt,
      CategoryId: task.CategoryId.toString(),
    });
    await this.client.rPush(this.userTasksKey(task.UserId), id.toString());
    await this.client.rPush(
      this.categoryTasksKey(task.UserId, task.CategoryId),
      id.toString()
    );
    return task;
  }

  async findAll(userId: string, categoryId?: number): Promise<Task[]> {
    await this.connect();
    let ids: string[];
    if (categoryId !== undefined) {
      ids = await this.client.lRange(
        this.categoryTasksKey(userId, categoryId),
        0, -1
      );
    } else {
      ids = await this.client.lRange(this.userTasksKey(userId), 0, -1);
    }
    const tasks: Task[] = [];
    for (const idStr of ids) {
      const id = parseInt(idStr, 10);
      const data = await this.client.hGetAll(this.taskKey(userId, id));
      if (!data || Object.keys(data).length === 0) continue;
      tasks.push(
        new Task(
          data.Description,
          data.UserId,
          data.ExpiredAt,
          parseInt(data.CategoryId, 10),
          id
        )
      );
    }
    return tasks;
  }

  async findById(taskId: number, userId: string): Promise<Task | null> {
    await this.connect();
    const data = await this.client.hGetAll(this.taskKey(userId, taskId));
    if (Object.keys(data).length === 0) return null;
    return new Task(
      data.Description,
      data.UserId,
      data.ExpiredAt,
      parseInt(data.CategoryId, 10),
      taskId
    );
  }

  async delete(userId: string, taskId: number): Promise<void> {
    await this.connect();
    const data = await this.client.hGetAll(this.taskKey(userId, taskId));
    if (!data || !data.CategoryId) return;
    const categoryId = parseInt(data.CategoryId, 10);
    await Promise.all([
      this.client.del(this.taskKey(userId, taskId)),
      this.client.lRem(this.userTasksKey(userId), 0, taskId.toString()),
      this.client.lRem(
        this.categoryTasksKey(userId, categoryId),
        0, taskId.toString()
      ),
    ]);
  }
}
