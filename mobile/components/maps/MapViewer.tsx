/**
 * MapViewer.tsx — Komponen peta universal I-Asset SMBR
 *
 * Untuk ganti provider peta, ubah MAP_PROVIDER di:
 *   config/mapConfig.ts
 *
 *   'leaflet' → OpenStreetMap via WebView (default, gratis)
 *   'google'  → Google Maps via react-native-maps
 */

import React from "react";
import { View, Text } from "react-native";
import { MAP_PROVIDER, DEFAULT_COORDINATES } from "@config/mapConfig";
import LeafletMap from "./LeafletMap";
import GoogleMap from "./GoogleMap";

interface MapViewerProps {
  latitude?: number | null;
  longitude?: number | null;
  namaAset?: string;
  height?: number;
}

export default function MapViewer({
  latitude,
  longitude,
  namaAset = "",
  height = 220,
}: MapViewerProps) {
  const lat = latitude ?? DEFAULT_COORDINATES.latitude;
  const lng = longitude ?? DEFAULT_COORDINATES.longitude;
  const hasCoordinates = !!latitude && !!longitude;

  return (
    <View>
      {MAP_PROVIDER === "google" ? (
        <GoogleMap
          latitude={lat}
          longitude={lng}
          namaAset={namaAset}
          height={height}
        />
      ) : (
        <LeafletMap
          latitude={lat}
          longitude={lng}
          namaAset={namaAset}
          height={height}
        />
      )}
      {!hasCoordinates && (
        <Text className="text-xs text-amber-600 mt-1 text-center">
          Koordinat belum tersedia — menampilkan lokasi default (Palembang)
        </Text>
      )}
    </View>
  );
}
