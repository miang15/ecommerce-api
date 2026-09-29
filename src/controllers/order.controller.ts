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

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid order status", 400);
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("items.product", "name image");

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  },
);

export const cancelOrder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user!.userId,
      }).session(session);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.status !== "pending" && order.status !== "confirmed") {
        throw new AppError("Order cannot be cancelled at this stage", 400);
      }

      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);

        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }

      order.status = "cancelled";

      await order.save({ session });

      await session.commitTransaction();

      await order.populate("items.product", "name image");

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
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

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1) {
      throw new AppError("Page must be a positive integer", 400);
    }

    if (!Number.isInteger(limit) || limit < 1) {
      throw new AppError("Limit must be a positive integer", 400);
    }

    const skip = (page - 1) * limit;

    const filter: { status?: OrderStatus } = {};

    if (req.query.status) {
      const status = String(req.query.status);

      if (!ORDER_STATUSES.includes(status as OrderStatus)) {
        throw new AppError("Invalid order status", 400);
      }

      filter.status = status as OrderStatus;
    }

    const orders = await Order.find(filter)
      .populate("user", "name email role")
      .populate("items.product", "name image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
      },
    });
  },
);

export const getOrderStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const item of stats) {
      result[item._id as keyof typeof result] = item.count;
      result.total += item.count;
    }

    res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully",
      data: result,
    });
  },
);
