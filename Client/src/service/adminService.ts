import { apiClient } from "./apiClient";
import type { AuthUser } from "./authService";
import type { Product } from "../types/Product";

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
  address?: string;
}

interface AdminResponse {
  message: string;
  user: AuthUser;
}

interface RemoveSellerResponse {
  message: string;
  userId: string;
}

interface SellerStatusResponse {
  message: string;
  user: AuthUser;
}

interface AdminSellerDetailResponse {
  seller: AuthUser;
  totalProducts: number;
}

export interface AdminOrder {
  _id: string;
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "processing" | "shipped" | "delivered";
  createdAt: string;
  items: Array<{
    product: string | { _id: string; name?: string };
    seller?: string;
    qty: number;
    price: number;
    commissionRate?: number;
    commissionAmount?: number;
    sellerNetAmount?: number;
  }>;
  user:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      };
}

export const createAdminRequest = async (payload: CreateAdminPayload) => {
  const response = await apiClient.post<AdminResponse>("/auth/admins", payload);
  return response.data;
};

export const getPendingSellersRequest = async () => {
  const response = await apiClient.get<AuthUser[]>("/auth/sellers/pending");
  return response.data;
};

export const approveSellerRequest = async (userId: string) => {
  const response = await apiClient.patch<AdminResponse>(`/auth/sellers/${userId}/approve`);
  return response.data;
};

export const getApprovedSellersRequest = async () => {
  const response = await apiClient.get<AuthUser[]>("/auth/sellers/approved");
  return response.data;
};

export const removeSellerRequest = async (userId: string) => {
  const response = await apiClient.delete<RemoveSellerResponse>(`/auth/sellers/${userId}`);
  return response.data;
};

export const updateSellerActiveStatusRequest = async (userId: string, sellerActive: boolean) => {
  const response = await apiClient.patch<SellerStatusResponse>(`/auth/sellers/${userId}/status`, {
    sellerActive,
  });
  return response.data;
};

export const getSellerDetailRequest = async (userId: string) => {
  const response = await apiClient.get<AdminSellerDetailResponse>(`/auth/sellers/${userId}`);
  return response.data;
};

export const getSellerProductsForAdminRequest = async (sellerId: string) => {
  const response = await apiClient.get<Product[]>(`/products/admin/seller/${sellerId}`);
  return response.data;
};

export const removeSellerProductAsAdminRequest = async (productId: string) => {
  const response = await apiClient.delete<{ message: string; productId: string }>(`/products/admin/${productId}`);
  return response.data;
};

export const getAllUsersRequest = async () => {
  const response = await apiClient.get<AuthUser[]>("/auth/users");
  return response.data;
};

export const getAdminOrdersRequest = async () => {
  const response = await apiClient.get<AdminOrder[]>("/orders/admin");
  return response.data;
};

export interface CommissionRule {
  _id: string;
  category: { _id: string; name: string };
  minQty: number;
  ratePercent: number;
  isActive: boolean;
}

export const getCommissionRulesRequest = async () => {
  const response = await apiClient.get<CommissionRule[]>("/commissions");
  return response.data;
};

export const createCommissionRuleRequest = async (payload: {
  category: string;
  minQty: number;
  ratePercent: number;
  isActive?: boolean;
}) => {
  const response = await apiClient.post<CommissionRule>("/commissions", payload);
  return response.data;
};

export const updateCommissionRuleRequest = async (
  ruleId: string,
  payload: Partial<{
    minQty: number;
    ratePercent: number;
    isActive: boolean;
  }>
) => {
  const response = await apiClient.put<CommissionRule>(`/commissions/${ruleId}`, payload);
  return response.data;
};

export const deleteCommissionRuleRequest = async (ruleId: string) => {
  const response = await apiClient.delete<{ message: string }>(`/commissions/${ruleId}`);
  return response.data;
};
