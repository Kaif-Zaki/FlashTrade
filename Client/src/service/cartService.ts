import { apiClient } from "./apiClient";
import type { CartResponse } from "../types/Cart";

export const getCartRequest = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/cart/my");
  return response.data;
};

export interface AddToCartPayload {
  product: string;
  qty: number;
  size?: string;
  color?: string;
}

export const addToCartRequest = async (
  payload: AddToCartPayload
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/cart/my/add", payload);
  return response.data;
};

export const removeFromCartRequest = async (
  productId: string,
  size?: string,
  color?: string
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>("/cart/my/remove", {
    productId,
    size,
    color,
  });
  return response.data;
};
