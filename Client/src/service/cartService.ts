import { apiClient } from "./apiClient";
import type { CartResponse } from "../types/Cart";

export const getCartRequest = async (userId: string): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>(`/cart/${userId}`);
  return response.data;
};

export interface AddToCartPayload {
  product: string;
  qty: number;
  size?: string;
  color?: string;
}

export const addToCartRequest = async (
  userId: string,
  payload: AddToCartPayload
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>(`/cart/${userId}/add`, payload);
  return response.data;
};

export const removeFromCartRequest = async (
  userId: string,
  productId: string,
  size?: string,
  color?: string
): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>(`/cart/${userId}/remove`, {
    productId,
    size,
    color,
  });
  return response.data;
};
