import { apiClient } from "./apiClient";
import type { Offer } from "../types/Offer";

export const getOffersRequest = async (): Promise<Offer[]> => {
  const response = await apiClient.get<Offer[]>("/offers");
  return response.data;
};
