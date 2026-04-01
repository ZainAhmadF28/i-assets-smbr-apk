export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://i-assets-smbr-apk-production.up.railway.app";

export const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT || 15000);
