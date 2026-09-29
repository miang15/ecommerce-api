import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderStats,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getMyOrders);
router.get("/admin", authMiddleware, roleMiddleware("admin"), getAllOrders);
router.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware("admin"),
  getOrderStats,
);
router.get("/:orderId", authMiddleware, getOrderById);
router.put(
  "/:orderId/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateOrderStatus,
);
router.put("/:orderId/cancel", authMiddleware, cancelOrder);

export default router;
