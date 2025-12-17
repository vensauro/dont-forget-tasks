import { Router } from "express";
import { TaskController } from "./controllers/TaskController";

export function createTaskRouter(controller: TaskController) {
  const router = Router();

  router.get("/", controller.listTasks);
  router.get("/:id", controller.getTask);

  return router;
}
