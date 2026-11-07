import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import upload from "../config/multer.js";
import {
  createProductWithUploadedImage,
  replaceUploadedProductImage,
} from "../controllers/product.controller.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  createProductWithUploadedImage,
);
// router.post("/", authMiddleware, roleMiddleware("admin"), createProduct);
router.get("/", getProducts);
router.patch(
  "/:id/image",
  authMiddleware,
  roleMiddleware("admin"),
  upload.single("image"),
  replaceUploadedProductImage,
);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteProduct);

export default router;
