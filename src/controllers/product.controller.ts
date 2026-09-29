import { Request, Response } from "express";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import Category from "../models/category.model.js";
import { getProductsQuerySchema } from "../validators/product.validator.js";
import Review from "../models/review.model.js";

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
    const parsed = getProductsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit, category, minPrice, maxPrice, sort, order, search } =
      parsed.data;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (category) filter.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = { [sort]: sortOrder };

    const products = await Product.find(filter)
      .populate("category", "name description image")
      .populate("createdBy", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const productIds = products.map((product) => product._id);

    const reviewStats = await Review.aggregate([
      {
        $match: {
          product: { $in: productIds },
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const reviewMap = new Map(
      reviewStats.map((item) => [
        item._id.toString(),
        {
          rating: Number(item.averageRating.toFixed(1)),
          reviewCount: item.reviewCount,
        },
      ]),
    );

    const productsWithReviews = products.map((product) => {
      const stats = reviewMap.get(product._id.toString());

      return {
        ...product.toObject(),
        rating: stats?.rating ?? 0,
        reviewCount: stats?.reviewCount ?? 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: productsWithReviews,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
      },
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
    const product = await Product.findById(req.params.id)
      .populate("category", "name description image")
      .populate("createdBy", "name email role");

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const reviewStats = await Review.aggregate([
      {
        $match: {
          product: product._id,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const stats = reviewStats[0];

    const productWithReviews = {
      ...product.toObject(),
      rating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
      reviewCount: stats?.reviewCount ?? 0,
    };

    res.status(200).json({
      success: true,
      data: productWithReviews,
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
