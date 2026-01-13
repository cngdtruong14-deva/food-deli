import express from "express";
import authMiddleware from "../middleware/auth.js";
import { 
  submitReview, 
  getPublicReviews, 
  getAdminReviews,
  checkReviewStatus,
  replyToReview,
  getProductReviews,
  deleteReview
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

// Protected: Submit a review (requires login)
reviewRouter.post("/submit", authMiddleware, submitReview);

// Public: Get reviews for a branch (masked user info)
reviewRouter.get("/public/:branchId", getPublicReviews);

// Admin: Get all reviews with full context
reviewRouter.post("/admin/list", authMiddleware, getAdminReviews);

// Admin: Reply to a review
reviewRouter.post("/admin/reply/:reviewId", authMiddleware, replyToReview);

// Admin: Delete a review
reviewRouter.post("/admin/delete/:reviewId", authMiddleware, deleteReview);

// Check if order has been reviewed
reviewRouter.get("/check/:orderId", checkReviewStatus);

// Public: Get reviews for a specific Product (Aggregation)
reviewRouter.get("/product/:foodId", getProductReviews);

export default reviewRouter;
