import type { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";
import AppError from "../utils/AppError.js";
import uploadImageStream from "../services/upload-stream.service.js";

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError("An image file is required", 400);
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (
      !detectedType ||
      !allowedMimeTypes.includes(detectedType.mime) ||
      detectedType.mime !== req.file.mimetype
    ) {
      throw new AppError("Invalid image file", 400);
    }

    const image = await uploadImageStream(req.file.buffer);

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: image,
    });
  } catch (error) {
    next(error);
  }
};
