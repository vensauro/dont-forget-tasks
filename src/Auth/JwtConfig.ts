import { Algorithm } from "jsonwebtoken";

export const JwtVerifyConfig = {
  secret: process.env.JWT_SECRET || "secret",
  issuer: process.env.JWT_ISSUER || "auth-server",
  audience: process.env.JWT_AUDIENCE || "dont-forget-app",
  algorithms: ["HS256"] as Algorithm[],
};
