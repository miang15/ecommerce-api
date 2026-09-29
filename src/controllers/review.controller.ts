import { Request, Response } from "express";
import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { rating, comment } = req.body;
    const productId = req.params.productId as string;

    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found or inactive", 404);
    }

    const existingReview = await Review.findOne({
      user: req.user!.userId,
      product: productId,
    });

    if (existingReview) {
      throw new AppError("You have already reviewed this product", 400);
    }

    const order = await Order.findOne({
      user: req.user!.userId,
      status: {
        $in: ["confirmed", "shipped", "delivered"],
      },
      "items.product": productId,
    });

    if (!order) {
      throw new AppError(
        "You can only review products you have purchased",
        403,
      );
    }

    const review = await Review.create({
      user: req.user!.userId,
      product: productId,
      rating,
      comment,
    });

    await review.populate("user", "name");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  },
);

export const getProductReviews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found or inactive", 404);
    }

    const reviews = await Review.find({
      product: productId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Product reviews fetched successfully",
      data: reviews,
    });
  },
);

export const updateReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const review = await Review.findOneAndUpdate(
      {
        _id: req.params.reviewId,
        user: req.user!.userId,
      },
      {
        rating,
        comment,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("user", "name");

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  },
);

export const deleteReview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      user: req.user!.userId,
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      data: review,
    });
  },
);

export const getProductReviewSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productId = req.params.productId as string;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found or inactive", 404);
    }

    const summary = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const result = summary[0] || {
      averageRating: 0,
      totalReviews: 0,
    };

    res.status(200).json({
      success: true,
      message: "Product review summary fetched successfully",
      data: {
        averageRating: Number(result.averageRating.toFixed(1)),
        totalReviews: result.totalReviews,
      },
    });
  },
);
