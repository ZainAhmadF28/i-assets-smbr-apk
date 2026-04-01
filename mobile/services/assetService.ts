import api from "./api";
import type {
  Asset,
  AssetFilterParams,
  AssetListResponse,
} from "@shared-types/index";
import { API_BASE_URL } from "@config/apiConfig";

export const assetService = {
  // ── GET semua aset (dengan filter & search) ──────────────────────────
  async getAll(params?: AssetFilterParams): Promise<AssetListResponse> {
    const response = await api.get<AssetListResponse>("/api/assets", { params });
    return response.data;
  },

  // ── GET detail satu aset ─────────────────────────────────────────────
  async getById(id: string): Promise<Asset> {
    const response = await api.get<Asset>(`/api/assets/${id}`);
    return response.data;
  },

  // ── GET log / riwayat aset ─────────────────────────────────────────────
  async getAssetLogs(id: string): Promise<any[]> {
    const response = await api.get<any[]>(`/api/assets/${id}/logs`);
    return response.data;
  },

  // ── POST tambah aset baru ─────────────────────────────────────────────
  async create(data: Partial<Asset>): Promise<Asset> {
    const response = await api.post<Asset>("/api/assets", data);
    return response.data;
  },

  // ── PUT update data aset ─────────────────────────────────────────────
  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    const response = await api.put<Asset>(`/api/assets/${id}`, data);
    return response.data;
  },

  // ── DELETE hapus aset ────────────────────────────────────────────────
  async remove(id: string): Promise<void> {
    await api.delete(`/api/assets/${id}`);
  },

  // ── POST upload foto aset ────────────────────────────────────────────
  async uploadPhoto(id: string, localUri: string): Promise<Asset> {
    const formData = new FormData();
    const filename = localUri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    // React Native FormData menerima plain object untuk file
    formData.append("photo", { uri: localUri, name: filename, type } as unknown as Blob);

    const response = await api.post<Asset>(`/api/assets/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ── Helper: bangun URL gambar aset ───────────────────────────────────
  getPhotoUrl(gambar: string | null): string | null {
    if (!gambar) return null;
    // Jika sudah full URL, kembalikan apa adanya
    if (gambar.startsWith("http")) return gambar;
    return `${API_BASE_URL}${gambar}`;
  },

  // ── Helper: bangun URL QR Code aset ─────────────────────────────────
  getQrUrl(id: string): string {
    return `${API_BASE_URL}/api/assets/${id}/qrcode`;
  },
};
