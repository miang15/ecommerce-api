import { Router } from "express";
import {
  addToWishlist,
  clearWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/:productId", addToWishlist);
router.get("/", getWishlist);
router.delete("/:productId", removeFromWishlist);
router.delete("/", clearWishlist);

export default router;
