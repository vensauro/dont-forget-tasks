import { createClient } from "redis";
import { ICategoryRepository } from "./ICategoryRepository";
import { Category, CategoryWithId } from "../models/Category";

type RedisClient = ReturnType<typeof createClient>;

export class RedisCategoryRepository implements ICategoryRepository {
  private static client: RedisClient;
  private client: RedisClient;

  private constructor(client: RedisClient) {
    this.client = client;
  }

  static async create(): Promise<RedisCategoryRepository> {
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

    return new RedisCategoryRepository(this.client);
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

  async save(userId: string, name: string): Promise<Category> {
    const id = await this.client.incr(this.counterKey(userId));

    await Promise.all([
      this.client.hSet(this.categoryKey(userId, id), {
        Id: id.toString(),
        UserId: userId,
        Name: name,
      }),
      this.client.rPush(this.listKey(userId), id.toString()),
    ]);

    return { Id: id, UserId: userId, Name: name };
  }

  async findAll(userId: string): Promise<Category[]> {
    const ids = await this.client.lRange(this.listKey(userId), 0, -1);
    const categories: Category[] = [];
    for (const idStr of ids) {
      const id = Number(idStr);
      const data = await this.client.hGetAll(
        this.categoryKey(userId, id)
      );
      if (!data || Object.keys(data).length === 0) continue;
      categories.push({
        Id: id,
        UserId: userId,
        Name: data.Name,
      });
    }
    return categories;
  }

  async findById(
    userId: string,
    categoryId: number
  ): Promise<Category | null> {
    const data = await this.client.hGetAll(
      this.categoryKey(userId, categoryId)
    );
    if (!data || Object.keys(data).length === 0) return null;
    return {
      Id: categoryId,
      UserId: userId,
      Name: data.Name,
    };
  }

  async update(category: CategoryWithId): Promise<Category> {
    const key = this.categoryKey(category.UserId, category.Id);
    const existing = await this.client.hGetAll(key);
    if (!existing || Object.keys(existing).length === 0) {
      throw new Error("Categoria não encontrada");
    }
    await this.client.hSet(key, {
      Name: category.Name,
    });
    return category;
  }

  async delete(userId: string, categoryId: number): Promise<void> {
    await Promise.all([
      this.client.del(this.categoryKey(userId, categoryId)),
      this.client.del(this.categoryTasksKey(userId, categoryId)),
      this.client.lRem(this.listKey(userId), 0, categoryId.toString()),
    ]);
  }
}
