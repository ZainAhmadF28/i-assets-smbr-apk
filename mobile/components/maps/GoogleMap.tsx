/**
 * GoogleMap.tsx
 *
 * Komponen placeholder untuk Google Maps.
 * Aktifkan dengan:
 *   1. Ubah MAP_PROVIDER = 'google' di config/mapConfig.ts
 *   2. Isi GOOGLE_MAPS_API_KEY di config/mapConfig.ts
 *   3. Install: npx expo install react-native-maps
 *   4. Uncomment kode di bawah
 */

import React from "react";
import { View, Text } from "react-native";

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  namaAset?: string;
  height: number;
}

export default function GoogleMap({
  latitude,
  longitude,
  namaAset = "",
  height,
}: GoogleMapProps) {
  // ─── Uncomment blok di bawah setelah install react-native-maps ───────
  //
  // import MapView, { Marker } from "react-native-maps";
  //
  // return (
  //   <MapView
  //     style={{ height, borderRadius: 12 }}
  //     initialRegion={{
  //       latitude,
  //       longitude,
  //       latitudeDelta: 0.005,
  //       longitudeDelta: 0.005,
  //     }}
  //   >
  //     <Marker coordinate={{ latitude, longitude }} title={namaAset} />
  //   </MapView>
  // );
  // ─────────────────────────────────────────────────────────────────────

  return (
    <View
      style={{ height, borderRadius: 12, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "#6b7280", fontSize: 13 }}>
        Google Maps — install react-native-maps untuk mengaktifkan
      </Text>
      <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
    </View>
  );
}
