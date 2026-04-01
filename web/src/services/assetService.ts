import api from "@/lib/api";
import { API_BASE_URL } from "@/config/apiConfig";
import type {
  Asset,
  AssetFilterParams,
  AssetListResponse,
  AssetStats,
} from "@/types";

export const assetService = {
  async getAll(params?: AssetFilterParams): Promise<AssetListResponse> {
    const response = await api.get<AssetListResponse>("/api/assets", { params });
    return response.data;
  },

  async getById(id: string): Promise<Asset> {
    const response = await api.get<Asset>(`/api/assets/${id}`);
    return response.data;
  },

  async getStats(): Promise<AssetStats> {
    const response = await api.get<AssetStats>("/api/assets/stats");
    return response.data;
  },

  async create(data: Partial<Asset>): Promise<Asset> {
    const response = await api.post<Asset>("/api/assets", data);
    return response.data;
  },

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    const response = await api.put<Asset>(`/api/assets/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/assets/${id}`);
  },

  async uploadPhoto(id: string, file: File): Promise<Asset> {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await api.post<Asset>(`/api/assets/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },

  getPhotoUrl(gambar: string | null): string | null {
    if (!gambar) return null;
    if (gambar.startsWith("http")) return gambar;
    return `${API_BASE_URL}${gambar}`;
  },

  getQrUrl(id: string): string {
    return `${API_BASE_URL}/api/assets/${id}/qrcode`;
  },
};
