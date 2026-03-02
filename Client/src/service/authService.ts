import { apiClient } from "./apiClient";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  address?: string;
}

interface LoginResponse extends AuthUser {
  accessToken: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  address?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const loginRequest = async (payload: LoginPayload) => {
  const response = await apiClient.post<LoginResponse>("/auth/login", payload);
  return response.data;
};

export const signupRequest = async (payload: SignupPayload) => {
  const response = await apiClient.post<AuthUser>("/auth/signup", payload);
  return response.data;
};

export const getProfileRequest = async () => {
  const response = await apiClient.get<AuthUser>("/auth/profile");
  return response.data;
};

export const logoutRequest = async () => {
  const response = await apiClient.post<{ message: string }>("/auth/logout");
  return response.data;
};

export const changePasswordRequest = async (payload: ChangePasswordPayload) => {
  const response = await apiClient.put<{ message: string }>("/auth/change-password", payload);
  return response.data;
};
