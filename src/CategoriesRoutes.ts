import { Router } from "express";
import { CategoryController } from "./controllers/CategoryController";

export function createCategoryRouter(controller: CategoryController) {
  const router = Router();

  router.get("/", controller.listCategories);
  router.get("/:id", controller.getCategory);

  return router;
}
