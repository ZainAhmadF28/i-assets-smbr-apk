import api from "@/lib/api";
import type { User } from "@/types";

type UserListResponse = {
  data: User[];
  total: number;
};

export const userService = {
  async getAll(): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>("/api/users");
    return response.data;
  },
};
