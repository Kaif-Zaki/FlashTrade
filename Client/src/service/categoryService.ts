import type { Category } from "../types/Category";
import { apiClient } from "./apiClient";

export const getCategoriesRequest = async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
};
