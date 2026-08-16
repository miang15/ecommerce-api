import { Request, Response } from "express";
import Category from "../models/category.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const createCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { createdBy, ...categoryData } = req.body;

    const category = await Category.create({
      ...categoryData,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  },
);

export const getCategories = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const categories = await Category.find({
      isActive: true,
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  },
);

export const getCategoryById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const category = await Category.findById(req.params.id).populate(
      "createdBy",
      "name email role",
    );

    if (!category || !category.isActive) {
      throw new AppError("Category not found", 404);
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { createdBy, ...categoryData } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("createdBy", "name email role");

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  },
);
