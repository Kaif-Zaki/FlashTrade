import { apiClient } from "./apiClient";
import type { Order, PlaceOrderPayload } from "../types/Order";

export const placeOrderRequest = async (payload: PlaceOrderPayload): Promise<Order> => {
  const response = await apiClient.post<Order>("/orders", payload);
  return response.data;
};

export const getUserOrdersRequest = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>("/orders/my");
  return response.data;
};

export const getOrderByIdRequest = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/my/${orderId}`);
  return response.data;
};
