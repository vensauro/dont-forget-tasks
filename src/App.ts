import express from "express";
import { json } from "body-parser";
import tasksRoutes from "./TasksRoutes";
import categoriesRoutes from './CategoriesRoutes';
import { authenticateJwt } from "./Auth/AuthMiddleware";

const app = express();

app.use(json());

app.use(authenticateJwt);

app.use("/tasks/v1", tasksRoutes);
app.use("/categories/v1", categoriesRoutes);

export default app;
