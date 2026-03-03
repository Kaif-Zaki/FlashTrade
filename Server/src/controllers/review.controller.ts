import { Request, Response } from "express";
import CustomerReview from "../models/Review";
import { ProductModel } from "../models/Product";
import { USER_ROLES } from "../constants/roles";

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

    const product = await ProductModel.findById(productId.trim()).select("_id");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const customerReview = new CustomerReview({
      name: name.trim(),
      email: email.trim(),
      rating: parsedRating,
      review: review.trim(),
      productId: productId.trim(),
      isApproved: false,
    });

    await customerReview.save();

    return res.status(201).json({
      message: "Review submitted and pending seller approval",
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

    const query = productId
      ? { productId: String(productId), isApproved: true }
      : { isApproved: true };
    const reviews = await CustomerReview.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getPendingSellerReviews = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    if (!authUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const products = await ProductModel.find({ seller: authUserId }).select("_id name");
    const sellerProductIds = products.map((product) => product._id.toString());
    const productNameById = new Map(products.map((product) => [product._id.toString(), product.name]));

    if (sellerProductIds.length === 0) {
      return res.json([]);
    }

    const reviews = await CustomerReview.find({
      productId: { $in: sellerProductIds },
      isApproved: false,
    }).sort({ createdAt: -1 });

    const mappedReviews = reviews.map((review) => ({
      ...review.toObject(),
      productName: productNameById.get(review.productId || "") || "Unknown Product",
    }));

    res.json(mappedReviews);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const approveReviewBySeller = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId;
    const authUserRole = req.userRole;
    const reviewId = Array.isArray(req.params.reviewId)
      ? req.params.reviewId[0]
      : req.params.reviewId;

    if (!authUserId || !authUserRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (authUserRole !== USER_ROLES.SELLER) {
      return res.status(403).json({ message: "Only sellers can approve reviews" });
    }

    const review = await CustomerReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    if (!review.productId) {
      return res.status(400).json({ message: "Review product is invalid" });
    }

    const product = await ProductModel.findById(review.productId).select("seller");
    if (!product) {
      return res.status(404).json({ message: "Product not found for this review" });
    }
    if (product.seller.toString() !== authUserId) {
      return res.status(403).json({ message: "You cannot approve reviews for this product" });
    }

    review.isApproved = true;
    review.approvedBy = product.seller;
    review.approvedAt = new Date();
    await review.save();

    res.status(200).json({
      message: "Review approved successfully",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
