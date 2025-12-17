import { ICategoryRepository } from "./ICategoryRepository";
import { InMemoryCategoryRepository } from "./InMemoryCategoryRepository";
import { RedisCategoryRepository } from "./RedisCategoryRepository";

let inMemoryInstance: InMemoryCategoryRepository | null = null;
let redisInstance: RedisCategoryRepository | null = null;

export class CategoryRepositoryFactory {
  static async create(): Promise<ICategoryRepository> {
    const useRedis = process.env.USE_REDIS === "true";

    if (useRedis) {
      if (!redisInstance) {
        console.log("Usando RedisCategoryRepository");
        redisInstance = await RedisCategoryRepository.create();
      }
      return redisInstance;
    }

    if (!inMemoryInstance) {
      console.log("Usando InMemoryCategoryRepository");
      inMemoryInstance = new InMemoryCategoryRepository();
    }

    return inMemoryInstance;
  }
}
