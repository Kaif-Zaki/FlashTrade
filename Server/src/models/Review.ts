import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerReview extends Document {
  name: string;
  email: string;
  rating: number;
  review: string;
  productId?: string;
  createdAt: Date;
}

const customerReviewSchema = new Schema<ICustomerReview>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true, trim: true },
  productId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.CustomerReview || mongoose.model<ICustomerReview>("CustomerReview", customerReviewSchema);
