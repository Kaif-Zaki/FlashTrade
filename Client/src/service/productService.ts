import type { Product } from "../types/Product";
import { apiClient } from "./apiClient";





// Get all products
export const getProductsRequest = async (): Promise<Product[]> => {
  const response = await apiClient.get("/products");
  return response.data;
};

// Get a single product by ID
export const getProductByIdRequest = async (
  productId: string
): Promise<Product> => {
  const response = await apiClient.get(`/products/${productId}`);
  return response.data;
};
