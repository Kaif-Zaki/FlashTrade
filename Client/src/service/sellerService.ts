import { apiClient } from "./apiClient";
import type { Product } from "../types/Product";
import type { Review } from "../types/Review";

export interface SellerProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  category: string;
}

export type SellerOrderStatus = "processing" | "shipped" | "delivered";
export type SellerPaymentStatus = "pending" | "paid";

export interface SellerOrderItem {
  product: Product;
  qty: number;
  size?: string;
  color?: string;
  price: number;
}

export interface SellerOrder {
  _id: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
  };
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: SellerOrderStatus;
  createdAt: string;
  sellerItems: SellerOrderItem[];
  sellerTotal: number;
  sellerCommissionTotal?: number;
  sellerNetTotal?: number;
}

export interface SellerPendingReview extends Review {
  productName?: string;
}

export interface SellerAnalytics {
  totalProducts: number;
  dailySales: number;
  monthlySales: number;
  monthlyCommission: number;
  monthlyNetEarnings: number;
  bestSellingProducts: Array<{
    productId: string;
    name: string;
    soldQty: number;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    name: string;
    stock: number;
  }>;
}

export const getSellerProductsRequest = async () => {
  const response = await apiClient.get<Product[]>("/products/seller/me");
  return response.data;
};

export const createSellerProductRequest = async (payload: SellerProductPayload) => {
  const response = await apiClient.post<Product>("/products", payload);
  return response.data;
};

export const updateSellerProductRequest = async (
  productId: string,
  payload: Partial<SellerProductPayload>
) => {
  const response = await apiClient.put<Product>(`/products/${productId}`, payload);
  return response.data;
};

export const deleteSellerProductRequest = async (productId: string) => {
  const response = await apiClient.delete<{ message: string }>(`/products/${productId}`);
  return response.data;
};

export const getSellerOrdersRequest = async () => {
  const response = await apiClient.get<SellerOrder[]>("/orders/seller");
  return response.data;
};

export const getSellerAnalyticsRequest = async () => {
  const response = await apiClient.get<SellerAnalytics>("/orders/seller/analytics");
  return response.data;
};

export const updateSellerOrderStatusRequest = async (
  orderId: string,
  orderStatus: SellerOrderStatus
) => {
  const response = await apiClient.patch<SellerOrder>(`/orders/${orderId}/status`, {
    orderStatus,
  });
  return response.data;
};

export const updateSellerOrderPaymentStatusRequest = async (
  orderId: string,
  paymentStatus: SellerPaymentStatus
) => {
  const response = await apiClient.patch<SellerOrder>(`/orders/${orderId}/payment-status`, {
    paymentStatus,
  });
  return response.data;
};

export const getPendingSellerReviewsRequest = async () => {
  const response = await apiClient.get<SellerPendingReview[]>("/reviews/seller/pending");
  return response.data;
};

export const approveSellerReviewRequest = async (reviewId: string) => {
  const response = await apiClient.patch<{ message: string; review: Review }>(
    `/reviews/seller/${reviewId}/approve`
  );
  return response.data;
};

export const estimateSellerCommissionRequest = async (params: {
  categoryId: string;
  qty: number;
  unitPrice: number;
}) => {
  const response = await apiClient.get<{
    ratePercent: number;
    grossAmount: number;
    commissionAmount: number;
    sellerNetAmount: number;
    ruleId: string | null;
  }>("/commissions/estimate", {
    params,
  });
  return response.data;
};
