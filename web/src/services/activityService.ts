import api from "@/lib/api";
import { API_BASE_URL } from "@/config/apiConfig";
import type { ActivityLogResponse } from "@/types";

export interface NewLogPayload {
  count: number;
  latest: Array<{
    id: string;
    action: string;
    assetName: string;
    assetNomor: string;
    details: string | null;
    createdAt: string;
  }>;
}

export const activityService = {
  async getAll(page = 1, limit = 20): Promise<ActivityLogResponse> {
    const response = await api.get<ActivityLogResponse>("/api/activity-logs", {
      params: { page, limit },
    });
    return response.data;
  },

  async getNewCount(since: string): Promise<NewLogPayload> {
    const response = await fetch(
      `${API_BASE_URL}/api/activity-logs/new?since=${encodeURIComponent(since)}`
    );
    if (!response.ok) {
      throw new Error("Gagal memuat notifikasi log baru");
    }
    return response.json() as Promise<NewLogPayload>;
  },
};
