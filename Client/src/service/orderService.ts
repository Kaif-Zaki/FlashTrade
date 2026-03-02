import { apiClient } from "./apiClient";
import type { Order, PlaceOrderPayload } from "../types/Order";

export const placeOrderRequest = async (payload: PlaceOrderPayload): Promise<Order> => {
  const response = await apiClient.post<Order>("/orders", payload);
  return response.data;
};

export const getUserOrdersRequest = async (userId: string): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>(`/orders/${userId}`);
  return response.data;
};

export const getOrderByIdRequest = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/order/${orderId}`);
  return response.data;
};
