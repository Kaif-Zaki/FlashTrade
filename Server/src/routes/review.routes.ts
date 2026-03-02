import { Router } from "express";
import { getReviews, createReview } from "../controllers/review.controller";

const contactRouter = Router();

// public customer reviews
contactRouter.post("/", createReview);
contactRouter.get("/", getReviews);

export default contactRouter;
