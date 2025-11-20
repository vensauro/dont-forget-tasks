import { Router } from "express";
import { TaskController } from "./controllers/TaskController";

const router = Router();
const controller = new TaskController();

router.get("/", controller.listTasks);
router.get("/:id", controller.getTask);

export default router;
