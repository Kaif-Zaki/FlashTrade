import type { Product } from "./Product";

export interface CartItem {
  product: Product;
  qty: number;
  size?: string;
  color?: string;
}

export interface CartResponse {
  _id?: string;
  user?: string;
  items: CartItem[];
}
