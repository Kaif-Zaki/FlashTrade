import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ICommissionRule extends Document {
  category: Types.ObjectId;
  minQty: number;
  maxQty?: number | null;
  ratePercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commissionRuleSchema = new Schema<ICommissionRule>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    minQty: {
      type: Number,
      required: true,
      min: 1,
    },
    maxQty: {
      type: Number,
      default: null,
      min: 1,
    },
    ratePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

commissionRuleSchema.index({ category: 1, minQty: 1, maxQty: 1, isActive: 1 });

export const CommissionRuleModel = mongoose.model<ICommissionRule>(
  "CommissionRule",
  commissionRuleSchema
);
