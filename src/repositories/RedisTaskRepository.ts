import { createClient, RedisClientType } from "redis";
import { ITaskRepository } from "./ITaskRepository";
import { Task } from "../models/Task";

export class RedisTaskRepository implements ITaskRepository {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });

    this.client.on("error", (err: any) => {
      console.error("❌ Erro no Redis:", err);
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("📦 Redis conectado com sucesso!");
    }
  }

  private counterKey() {
    return `tasks:counter`;
  }

  private sortedSetKey(userId: string) {
    return `tasks:${userId}:zset`;
  }

  private hashKey(taskId: number) {
    return `task:${taskId}`;
  }

  async save(task: Task): Promise<Task> {
    await this.connect();

    const id = await this.client.incr(this.counterKey());
    task.id = id;

    await this.client.hSet(this.hashKey(id), {
      description: task.description,
      userId: task.userId,
      dateTime: task.dateTime.getTime().toString()
    });

    await this.client.zAdd(this.sortedSetKey(task.userId), [
      { score: task.dateTime.getTime(), value: id.toString() }
    ]);

    return task;
  }

  async findAll(userId: string, from?: number, to?: number): Promise<Task[]> {
    await this.connect();

    const min = from !== undefined ? from : "-inf";
    const max = to !== undefined ? to : "+inf";

    const idStrings = await this.client.zRangeByScore(this.sortedSetKey(userId), min as any, max as any);
    const tasks: Task[] = [];

    for (const idStr of idStrings) {
      const id = parseInt(idStr, 10);
      const data = await this.client.hGetAll(this.hashKey(id));
      if (!data || Object.keys(data).length === 0) continue;

      const t = new Task(
        data.description,
        data.userId,
        new Date(parseInt(data.dateTime || "0", 10))
      );
      t.id = id;
      tasks.push(t);
    }

    return tasks;
  }

  async delete(userId: string, taskId: number): Promise<void> {
    await this.connect();
    await this.client.del(this.hashKey(taskId));
    await this.client.zRem(this.sortedSetKey(userId), taskId.toString());
  }

  async findById(taskId: number): Promise<Task | null> {
    await this.connect();
    const data = await this.client.hGetAll(this.hashKey(taskId));
    if (Object.keys(data).length === 0) return null;

    const t = new Task(
      data.description,
      data.userId,
      new Date(parseInt(data.dateTime || "0", 10))
    );
    t.id = taskId;

    return t;
  }
}
