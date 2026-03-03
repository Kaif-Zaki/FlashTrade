import { Router } from "express";
import {
  getReviews,
  createReview,
  getPendingSellerReviews,
  approveReviewBySeller,
} from "../controllers/review.controller";
import { authenticateToken } from "../middlewares/authenticateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { USER_ROLES } from "../constants/roles";
import { requireApprovedSeller } from "../middlewares/requireApprovedSeller";

const contactRouter = Router();

// public customer reviews
contactRouter.post("/", createReview);
contactRouter.get("/", getReviews);
contactRouter.get(
  "/seller/pending",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  getPendingSellerReviews
);
contactRouter.patch(
  "/seller/:reviewId/approve",
  authenticateToken,
  authorizeRoles(USER_ROLES.SELLER),
  requireApprovedSeller,
  approveReviewBySeller
);

export default contactRouter;
