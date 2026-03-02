import { apiClient } from "./apiClient";

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactMessage = async (payload: ContactPayload) => {
  const response = await apiClient.post<{ message: string }>("/email/contact", payload);
  return response.data;
};
