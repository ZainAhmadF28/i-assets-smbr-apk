// =============================================
// MAP PROVIDER CONFIGURATION
// =============================================
// Untuk ganti provider peta, ubah MAP_PROVIDER di bawah:
//   'leaflet' → OpenStreetMap via WebView (gratis, tanpa API key)
//   'google'  → Google Maps via react-native-maps (butuh API key)
// =============================================

export type MapProviderType = "leaflet" | "google";

export const MAP_PROVIDER: MapProviderType = "leaflet";

// Isi API key di bawah jika MAP_PROVIDER = 'google'
export const GOOGLE_MAPS_API_KEY = "";

// Zoom level default untuk tampilan detail aset
export const DEFAULT_ZOOM = 16;

// Koordinat default (Palembang, Sumatera Selatan) — dipakai jika aset belum ada koordinat
export const DEFAULT_COORDINATES = {
  latitude: -2.9761,
  longitude: 104.7754,
};
