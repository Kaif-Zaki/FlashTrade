import type { Category } from "../types/Category";
import { apiClient } from "./apiClient";

export const getCategoriesRequest = async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
};

export const createCategoryRequest = async (payload: {
  name: string;
  description?: string;
  imageUrl?: string;
}): Promise<Category> => {
  const response = await apiClient.post<Category>("/categories", payload);
  return response.data;
};

export const updateCategoryRequest = async (
  categoryId: string,
  payload: {
    name?: string;
    description?: string;
    imageUrl?: string;
  }
): Promise<Category> => {
  const response = await apiClient.put<Category>(`/categories/${categoryId}`, payload);
  return response.data;
};

export const deleteCategoryRequest = async (categoryId: string) => {
  const response = await apiClient.delete<{ message: string }>(`/categories/${categoryId}`);
  return response.data;
};
