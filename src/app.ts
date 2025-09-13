import express from "express";
import { json } from "body-parser";
import userRoutes from "./routes";

const app = express();

app.use(json());

// registrar rotas de módulos
app.use("/users", userRoutes);

export default app;
