import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), createCategory);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);

export default router;
