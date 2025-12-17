import { createClient } from "redis";
import { ITaskRepository } from "./ITaskRepository";
import { Task } from "../models/Task";

type RedisClient = ReturnType<typeof createClient>;

export class RedisTaskRepository implements ITaskRepository {
  private static client: RedisClient;
  private client: RedisClient;

  private constructor(client: RedisClient) {
    this.client = client;
  }

  static async create(): Promise<RedisTaskRepository> {
    if (!this.client) {
      const client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });

      client.on("error", err => {
        console.error("[Redis] Erro:", err);
      });

      await client.connect();
      console.log("[Redis] Conectado com sucesso");

      this.client = client;
    }

    return new RedisTaskRepository(this.client);
  }

  private counterKey(userId: string) {
    return `tasks:${userId}:counter`;
  }

  private listKey(userId: string) {
    return `tasks:${userId}`;
  }

  private taskKey(userId: string, taskId: number) {
    return `task:${userId}:${taskId}`;
  }

  private categoryTasksKey(userId: string, categoryId: number) {
    return `category:${userId}:${categoryId}:tasks`;
  }

  async save(task: Task): Promise<Task> {
    const id = await this.client.incr(this.counterKey(task.UserId));
    task.Id = id;
    await Promise.all([
      this.client.hSet(this.taskKey(task.UserId, id), {
        Id: id.toString(),
        UserId: task.UserId,
        Description: task.Description,
        ExpiredAt: task.ExpiredAt,
        CategoryId: task.CategoryId.toString(),
      }),
      this.client.rPush(this.listKey(task.UserId), id.toString()),
      this.client.rPush(
        this.categoryTasksKey(task.UserId, task.CategoryId),
        id.toString()
      ),
    ]);
    return task;
  }

  async findAll(
    userId: string,
    categoryId?: number
  ): Promise<Task[]> {
    const ids =
      categoryId !== undefined
        ? await this.client.lRange(
            this.categoryTasksKey(userId, categoryId),
            0,
            -1
          )
        : await this.client.lRange(this.listKey(userId), 0, -1);
    const tasks: Task[] = [];
    for (const idStr of ids) {
      const id = Number(idStr);
      const data = await this.client.hGetAll(
        this.taskKey(userId, id)
      );
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

  async findById(
    taskId: number,
    userId: string
  ): Promise<Task | null> {
    const data = await this.client.hGetAll(
      this.taskKey(userId, taskId)
    );
    if (!data || Object.keys(data).length === 0) return null;
    return new Task(
      data.Description,
      data.UserId,
      data.ExpiredAt,
      parseInt(data.CategoryId, 10),
      taskId
    );
  }

  async update(task: Task & { Id: number }): Promise<Task> {
    const key = this.taskKey(task.UserId, task.Id);
    const existing = await this.client.hGetAll(key);
    if (!existing || Object.keys(existing).length === 0) {
      throw new Error("Task não encontrada");
    }
    const oldCategoryId = Number(existing.CategoryId);
    await this.client.hSet(key, {
      Description: task.Description,
      ExpiredAt: task.ExpiredAt,
      CategoryId: task.CategoryId.toString(),
    });

    if (oldCategoryId !== task.CategoryId) {
      await Promise.all([
        this.client.lRem(
          this.categoryTasksKey(task.UserId, oldCategoryId),
          0,
          task.Id.toString()
        ),
        this.client.rPush(
          this.categoryTasksKey(task.UserId, task.CategoryId),
          task.Id.toString()
        ),
      ]);
    }

    return task;
  }

  async delete(
    userId: string,
    taskId: number
  ): Promise<void> {
    const data = await this.client.hGetAll(
      this.taskKey(userId, taskId)
    );
    if (!data || !data.CategoryId) return;
    await Promise.all([
      this.client.del(this.taskKey(userId, taskId)),
      this.client.lRem(this.listKey(userId), 0, taskId.toString()),
      this.client.lRem(
        this.categoryTasksKey(userId, Number(data.CategoryId)),
        0,
        taskId.toString()
      ),
    ]);
  }
}
