import { Request, Response } from "express";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createOrder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const cart = await Cart.findOne({
        user: req.user!.userId,
      }).session(session);

      if (!cart) {
        throw new AppError("Cart not found", 404);
      }

      if (cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }

      const orderItems = [];
      let totalAmount = 0;

      for (const item of cart.items) {
        const product = await Product.findOne({
          _id: item.product,
          isActive: true,
        }).session(session);

        if (!product) {
          throw new AppError("One or more products are unavailable", 400);
        }

        if (item.quantity > product.stock) {
          throw new AppError(`Insufficient stock for ${product.name}`, 400);
        }

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
        });

        totalAmount += product.price * item.quantity;

        product.stock -= item.quantity;

        await product.save({ session });
      }

      const [order] = await Order.create(
        [
          {
            user: req.user!.userId,
            items: orderItems,
            totalAmount,
          },
        ],
        { session },
      );

      cart.items.splice(0, cart.items.length);
      await cart.save({ session });

      await session.commitTransaction();

      await order.populate("items.product", "name image");

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  },
);

export const getMyOrders = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const orders = await Order.find({
      user: req.user!.userId,
    })
      .populate("items.product", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  },
);

export const getOrderById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user!.userId,
    }).populate("items.product", "name image");

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  },
);
