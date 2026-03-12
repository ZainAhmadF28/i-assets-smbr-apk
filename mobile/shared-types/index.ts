// Tipe data utama untuk I-Asset SMBR

export type Kategori = "BANGUNAN" | "KENDARAAN_DINAS" | "PERLENGKAPAN" | "TANAH";
export type Kondisi = "BAIK" | "RUSAK" | "RUSAK_BERAT" | "HILANG";
export type Role = "ADMIN";

export interface Asset {
  id: string;
  nomorAset: string;
  namaAset: string;
  kategori: Kategori;
  quantity: number;
  satuanUnit: string;
  gambar: string | null;
  fotoTimestamp: string | null; // ISO datetime string
  latitude: number | null;
  longitude: number | null;
  kondisi: Kondisi;
  report: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AssetListResponse {
  data: Asset[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetFilterParams {
  search?: string;
  kategori?: Kategori | "";
  kondisi?: Kondisi | "";
  page?: number;
  limit?: number;
}

export const KATEGORI_LABEL: Record<Kategori, string> = {
  BANGUNAN: "Bangunan",
  KENDARAAN_DINAS: "Kendaraan Dinas",
  PERLENGKAPAN: "Perlengkapan",
  TANAH: "Tanah",
};

export const KONDISI_LABEL: Record<Kondisi, string> = {
  BAIK: "Baik",
  RUSAK: "Rusak",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
};

export const KONDISI_COLOR: Record<Kondisi, string> = {
  BAIK: "#16a34a",
  RUSAK: "#d97706",
  RUSAK_BERAT: "#dc2626",
  HILANG: "#64748b", // slate gray for missing
};
