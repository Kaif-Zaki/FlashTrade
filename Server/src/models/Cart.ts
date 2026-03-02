import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  qty: number;
  size?: string;
  color?: string;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
}

const cartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      qty: { type: Number, required: true },
      size: { type: String },
      color: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICart>("Cart", cartSchema);