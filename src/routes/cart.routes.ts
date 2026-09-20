import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cart.controller.js";

const router = Router();

router.post("/items", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/items/:productId", authMiddleware, updateCartItem);
router.delete("/items/:productId", authMiddleware, removeCartItem);
router.delete("/", authMiddleware, clearCart);

export default router;
