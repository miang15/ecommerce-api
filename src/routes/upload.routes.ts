import { Router } from "express";
import upload from "../config/multer.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { uploadProductImage } from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/product-image",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  uploadProductImage,
);

export default router;
