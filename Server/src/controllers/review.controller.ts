import { Request, Response } from "express";
import CustomerReview from "../models/Review";

// CREATE CUSTOMER REVIEW
export const createReview = async (req: Request, res: Response) => {
  try {
    const { name, email, rating, review, productId } = req.body as {
      name?: string;
      email?: string;
      rating?: number;
      review?: string;
      productId?: string;
    };

    if (!name?.trim() || !email?.trim() || !review?.trim() || !productId?.trim()) {
      return res.status(400).json({
        message: "Name, email, rating, review, and productId are required",
      });
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const customerReview = new CustomerReview({
      name: name.trim(),
      email: email.trim(),
      rating: parsedRating,
      review: review.trim(),
      productId: productId.trim(),
    });

    await customerReview.save();

    return res.status(201).json({
      message: "Review submitted successfully",
      review: customerReview,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err });
  }
};

// GET ALL REVIEWS
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    const query = productId ? { productId: String(productId) } : {};
    const reviews = await CustomerReview.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
