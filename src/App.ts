import express from "express";
import { json } from "body-parser";
import { authenticateJwt } from "./Auth/AuthMiddleware";
import { TaskController } from "./controllers/TaskController";
import { CategoryController } from "./controllers/CategoryController";
import { createTaskRouter } from "./TasksRoutes";
import { createCategoryRouter } from "./CategoriesRoutes";

export async function createApp() {
  const app = express();

  app.use(json());
  app.use(authenticateJwt);

  const taskController = await TaskController.create();
  const categoryController = await CategoryController.create();

  app.use("/tasks/v1", createTaskRouter(taskController));
  app.use("/categories/v1", createCategoryRouter(categoryController));

  return app;
}
