import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT } from "@config/apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token ke setiap request jika tersedia
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → hapus token & biarkan screen handle redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
    }
    return Promise.reject(error);
  }
);

export default api;
