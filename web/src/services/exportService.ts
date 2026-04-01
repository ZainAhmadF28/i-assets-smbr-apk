import { API_BASE_URL } from "@/config/apiConfig";

export type ExportTable = "aset" | "user" | "log";

export function getExportUrl(table: ExportTable, search = ""): string {
  const qs = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return `${API_BASE_URL}/api/export/${table}${qs}`;
}
