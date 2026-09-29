import { Request, Response } from "express";
import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addToWishlist = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const productId = req.params.productId as string;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let wishlist = await Wishlist.findOne({
      user: req.user!.userId,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user!.userId,
        products: [productId],
      });
    } else {
      const alreadyExists = wishlist.products.some(
        (id) => id.toString() === productId,
      );

      if (alreadyExists) {
        throw new AppError("Product already exists in wishlist", 400);
      }

      wishlist.products.push(product._id);
      await wishlist.save();
    }

    await wishlist.populate("products", "name price image stock isActive");

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlist,
    });
  },
);

export const getWishlist = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wishlist = await Wishlist.findOne({
      user: req.user!.userId,
    }).populate("products", "name price image stock isActive");

    if (!wishlist) {
      res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully",
        data: {
          products: [],
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: wishlist,
    });
  },
);

export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user!.userId,
    });

    if (!wishlist) {
      throw new AppError("Wishlist not found", 404);
    }

    const productIndex = wishlist.products.findIndex(
      (id) => id.toString() === productId,
    );

    if (productIndex === -1) {
      throw new AppError("Product not found in wishlist", 404);
    }

    wishlist.products.splice(productIndex, 1);

    await wishlist.save();

    await wishlist.populate("products", "name price image stock isActive");

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: wishlist,
    });
  },
);

export const clearWishlist = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const wishlist = await Wishlist.findOne({
      user: req.user!.userId,
    });

    if (!wishlist) {
      throw new AppError("Wishlist not found", 404);
    }

    wishlist.products = [];

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      data: wishlist,
    });
  },
);
