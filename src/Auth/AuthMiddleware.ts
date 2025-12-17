import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createSender } from "../utils/Response";
import { JwtVerifyConfig } from "./JwtConfig";
import { JwtPayload } from "./JwtPayload";

export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const send = createSender(res);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return send.badRequest({}, {
      Message: "Header Authorization não informado"
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return send.badRequest({}, {
      Message: "Formato do token inválido"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      JwtVerifyConfig.secret,
      {
        issuer: JwtVerifyConfig.issuer,
        audience: JwtVerifyConfig.audience,
        algorithms: JwtVerifyConfig.algorithms,
      }
    ) as JwtPayload;

    req.user = decoded;

    return next();
  } catch (error: any) {
    console.error("JWT VERIFY ERROR:", error.name, error.message);
    return send.badRequest({}, {
      Message: "Token inválido, expirado ou não confiável"
    });
  }
}
