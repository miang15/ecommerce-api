import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createReview,
  deleteReview,
  getProductReviews,
  getProductReviewSummary,
  updateReview,
} from "../controllers/review.controller.js";

const router = Router();

router.post("/products/:productId/reviews", authMiddleware, createReview);
router.get("/products/:productId/reviews/summary", getProductReviewSummary);
router.get("/products/:productId/reviews", getProductReviews);
router.put("/reviews/:reviewId", authMiddleware, updateReview);
router.delete("/reviews/:reviewId", authMiddleware, deleteReview);

export default router;
