import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import multer from "multer";

const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  if (error.name === "ValidationError") {
    const validationError = error as mongoose.Error.ValidationError;

    const errors: Record<string, string> = {};

    Object.keys(validationError.errors).forEach((field) => {
      errors[field] = validationError.errors[field].message;
    });

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });

    return;
  }

  // Inside your existing error middleware:
  if (error instanceof multer.MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    res.status(statusCode).json({
      success: false,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must not exceed 5 MB"
          : error.message,
    });
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorMiddleware;
