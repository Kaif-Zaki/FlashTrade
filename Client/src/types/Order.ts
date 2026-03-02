import type { Product } from "./Product";

export type PaymentMethod = "cash" | "online";

export interface PlaceOrderPayload {
  userId: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
}

export interface OrderItem {
  product: Product | string;
  qty: number;
  size?: string;
  color?: string;
  price: number;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "processing" | "shipped" | "delivered";
  createdAt: string;
}

export interface CheckoutDraft {
  firstName: string;
  lastName: string;
  mobile: string;
  postalCode: string;
  address: string;
  paymentMethod: PaymentMethod;
}
