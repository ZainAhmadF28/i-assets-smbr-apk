import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthResponse, User } from "@shared-types/index";

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/api/auth/login", {
      username,
      password,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(user));
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
  },

  async getStoredUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem("auth_user");
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem("auth_token");
    return !!token;
  },
};
