import { apiClient } from "./apiClient";
import type { CreateReviewPayload, Review } from "../types/Review";

export const getReviewsRequest = async (productId?: string): Promise<Review[]> => {
  const response = await apiClient.get<Review[]>("/reviews", {
    params: productId ? { productId } : undefined,
  });
  return response.data;
};

export const createReviewRequest = async (payload: CreateReviewPayload): Promise<Review> => {
  const response = await apiClient.post<{ review: Review }>("/reviews", payload);
  return response.data.review;
};
