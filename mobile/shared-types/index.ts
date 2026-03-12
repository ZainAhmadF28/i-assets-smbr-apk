// Tipe data utama untuk I-Asset SMBR

export type Kondisi = "BAIK" | "RUSAK" | "RUSAK_BERAT" | "HILANG" | "BELUM_DICEK";

export interface Asset {
  id: string;
  kodeKelas: string | null;
  kelasAsetSmbr: string | null;
  kelasAsetSig: string | null;
  nomorAset: string;
  namaAset: string;
  site: string | null;
  qty: number;
  satuan: string | null;
  latitude: number | null;
  longitude: number | null;
  tanggalUpdate: string | null;
  fotoUrl: string | null;
  kondisi: Kondisi;
  keterangan: string | null;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  kategori?: string;
  kondisi?: Kondisi | "";
  page?: number;
  limit?: number;
}

export const KONDISI_LABEL: Record<Kondisi, string> = {
  BAIK: "Baik",
  RUSAK: "Rusak",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
  BELUM_DICEK: "Belum Dicek",
};

export const KONDISI_COLOR: Record<Kondisi, string> = {
  BAIK: "#16a34a",
  RUSAK: "#d97706",
  RUSAK_BERAT: "#dc2626",
  HILANG: "#64748b",
  BELUM_DICEK: "#94a3b8", // slate-400
};
