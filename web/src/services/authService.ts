import api from "@/lib/api";
import type { AuthResponse } from "@/types";
import {
  clearAuthSession,
  getStoredUser,
  setAuthSession,
} from "@/lib/authStorage";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;
    setAuthSession(token, user);
    return response.data;
  },

  async logout(): Promise<void> {
    clearAuthSession();
  },

  async getStoredUser() {
    return getStoredUser();
  },

  async isLoggedIn(): Promise<boolean> {
    return !!getStoredUser();
  },
};
