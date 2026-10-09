import type { Request, Response, NextFunction } from "express";
import uploadImage from "../services/upload.service.js";
import AppError from "../utils/AppError.js";

export const testUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filePath = req.body.filePath;

    if (typeof filePath !== "string" || !filePath.trim()) {
      throw new AppError("filePath is required", 400);
    }

    const image = await uploadImage(filePath);

    res.status(201).json({
      success: true,
      data: image,
    });
  } catch (error) {
    next(error);
  }
};
