import mongoose, { Schema, Document } from "mongoose";

export interface IOffer extends Document {
  title: string;
  description?: string;
  discountPercent: number;
  validTill: Date;
}

const offerSchema = new Schema<IOffer>({
  title: { type: String, required: true },
  description: { type: String },
  discountPercent: { type: Number, required: true },
  validTill: { type: Date, required: true }
});

export default mongoose.model<IOffer>("Offer", offerSchema);