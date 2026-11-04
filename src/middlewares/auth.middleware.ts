import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import { env } from "../config/env.js";

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  role: "user" | "admin";
}

const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    next(new AppError("Authentication required", 401));
    return;
  }

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !["user", "admin"].includes(decoded.role as string)
    ) {
      next(new AppError("Invalid access token", 401));
      return;
    }

    const payload = decoded as AccessTokenPayload;

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
};

export default authMiddleware;
