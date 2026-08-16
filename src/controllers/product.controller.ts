import { Request, Response } from "express";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import Category from "../models/category.model.js";

export const createProduct = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log(req.user);
    const { createdBy, ...productData } = req.body;

    const category = await Category.findOne({
      _id: productData.category,
      isActive: true,
    });

    if (!category) {
      throw new AppError("Category not found or inactive", 404);
    }

    const product = await Product.create({
      ...productData,
      createdBy: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  },
);

export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const products = await Product.find().populate(
      "createdBy",
      "name email role",
    );

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  },
);

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};
