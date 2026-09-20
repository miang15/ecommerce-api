import { Request, Response } from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addToCart = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found or inactive", 404);
    }

    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    if (quantity > product.stock) {
      throw new AppError("Insufficient stock", 400);
    }

    let cart = await Cart.findOne({
      user: req.user!.userId,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user!.userId,
        items: [
          {
            product: productId,
            quantity,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId,
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          throw new AppError("Insufficient stock", 400);
        }

        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
        });
      }

      await cart.save();
    }

    await cart.populate("items.product", "name price image stock isActive");

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart,
    });
  },
);

export const getCart = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cart = await Cart.findOne({
      user: req.user!.userId,
    }).populate("items.product", "name price image stock isActive");

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  },
);

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) {
      throw new AppError("Quantity must be at least 1", 400);
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new AppError("Product not found or inactive", 404);
    }

    if (quantity > product.stock) {
      throw new AppError("Insufficient stock", 400);
    }

    const cart = await Cart.findOne({
      user: req.user!.userId,
    });

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      throw new AppError("Product not found in cart", 404);
    }

    item.quantity = quantity;

    await cart.save();

    await cart.populate("items.product", "name price image stock isActive");

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cart,
    });
  },
);

export const removeCartItem = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;

    const cart = await Cart.findOne({
      user: req.user!.userId,
    });

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new AppError("Product not found in cart", 404);
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    await cart.populate("items.product", "name price image stock isActive");

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: cart,
    });
  },
);

export const clearCart = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cart = await Cart.findOne({
      user: req.user!.userId,
    });

    if (!cart) {
      throw new AppError("Cart not found", 404);
    }

    cart.items.splice(0, cart.items.length);

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  },
);
