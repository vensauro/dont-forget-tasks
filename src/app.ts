import express from "express";
import { json } from "body-parser";
import tasksRoutes from "./tasksRoutes";
import categoriesRoutes from './categoriesRoutes';

const app = express();

app.use(json());

app.use("/tasks/v1", tasksRoutes);
app.use("/categories/v1", categoriesRoutes);

export default app;
