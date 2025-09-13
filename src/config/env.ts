import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  rabbitUrl: process.env.RABBIT_URL || "amqp://localhost",
};
