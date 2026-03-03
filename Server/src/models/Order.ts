import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  seller?: Types.ObjectId;
  qty: number;
  size?: string;
  color?: string;
  price: number;
  commissionRate: number;
  commissionAmount: number;
  sellerNetAmount: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string; 
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "processing" | "shipped" | "delivered";
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      seller: { type: Schema.Types.ObjectId, ref: "User" },
      qty: { type: Number, required: true },
      size: { type: String },
      color: { type: String },
      price: { type: Number, required: true },
      commissionRate: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 },
      sellerNetAmount: { type: Number, default: 0 },
    }
  ],
  totalPrice: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  orderStatus: { type: String, enum: ["processing", "shipped", "delivered"], default: "processing" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOrder>("Order", orderSchema);
