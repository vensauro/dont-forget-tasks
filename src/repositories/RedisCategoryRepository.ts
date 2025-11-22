import { createClient, RedisClientType } from "redis";
import { ICategoryRepository } from "./ICategoryRepository";
import { Category } from "../models/Category";

export class RedisCategoryRepository implements ICategoryRepository {
  private static client: RedisClientType | null = null;
  private client: RedisClientType;

  constructor() {
    if (!RedisCategoryRepository.client) {
      RedisCategoryRepository.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });
    }
    this.client = RedisCategoryRepository.client!;
  }

  private async connect() {
    if (!this.client.isOpen) await this.client.connect();
  }

  private counterKey(userId: string) {
    return `categories:${userId}:counter`;
  }

  private listKey(userId: string) {
    return `categories:${userId}`;
  }

  private categoryKey(userId: string, categoryId: number) {
    return `category:${userId}:${categoryId}`;
  }

  private categoryTasksKey(userId: string, categoryId: number) {
    return `category:${userId}:${categoryId}:tasks`;
  }

  private userTasksKey(userId: string) {
    return `tasks:${userId}`;
  }

  private taskKey(userId: string, taskId: number) {
    return `task:${userId}:${taskId}`;
  }

  async save(userId: string, name: string): Promise<Category> {
    await this.connect();
    const id = await this.client.incr(this.counterKey(userId));
    await this.client.hSet(this.categoryKey(userId, id), {
      Id: id.toString(),
      UserId: userId,
      Name: name,
    });
    await this.client.rPush(this.listKey(userId), id.toString());
    return { Id: id, UserId: userId, Name: name };
  }

  async findAll(userId: string): Promise<Category[]> {
    await this.connect();
    const ids = await this.client.lRange(this.listKey(userId), 0, -1);
    const categories: Category[] = [];
    for (const idStr of ids) {
      const id = parseInt(idStr, 10);
      const data = await this.client.hGetAll(this.categoryKey(userId, id));
      if (Object.keys(data).length === 0) continue;
      categories.push({
        Id: id,
        UserId: userId,
        Name: data.Name,
      });
    }
    return categories;
  }

  async findById(userId: string, categoryId: number): Promise<Category | null> {
    await this.connect();
    const data = await this.client.hGetAll(this.categoryKey(userId, categoryId));
    if (Object.keys(data).length === 0) return null;
    return {
      Id: categoryId,
      UserId: userId,
      Name: data.Name,
    };
  }

  async delete(userId: string, categoryId: number): Promise<void> {
    await this.connect();
    const taskIds = await this.client.lRange(
      this.categoryTasksKey(userId, categoryId),
      0,
      -1
    );
    for (const idStr of taskIds) {
      const taskId = parseInt(idStr, 10);
      await Promise.all([
        this.client.del(this.taskKey(userId, taskId)),
        this.client.lRem(this.userTasksKey(userId), 0, idStr),
      ]);
    }
    await this.client.del(this.categoryTasksKey(userId, categoryId));
    await Promise.all([
      this.client.del(this.categoryKey(userId, categoryId)),
      this.client.lRem(this.listKey(userId), 0, categoryId.toString()),
    ]);
  }
}
