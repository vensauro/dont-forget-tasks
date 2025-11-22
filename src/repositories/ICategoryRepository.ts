import { Category } from "../models/Category";

export interface ICategoryRepository {
  save(userId: string, name: string): Promise<Category>;
  findAll(userId: string): Promise<Category[]>;
  findById(userId: string, categoryId: number): Promise<Category | null>;
  delete(userId: string, categoryId: number): Promise<void>;
}
