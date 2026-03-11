import React from "react";
import { WebView } from "react-native-webview";
import { View } from "react-native";
import { DEFAULT_ZOOM } from "@config/mapConfig";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  namaAset?: string;
  height: number;
}

function buildLeafletHtml(
  lat: number,
  lng: number,
  title: string,
  zoom: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var marker = L.marker([${lat}, ${lng}]).addTo(map);
    if ("${title}") {
      marker.bindPopup("<b>${title.replace(/"/g, "&quot;")}</b>").openPopup();
    }
  </script>
</body>
</html>
  `.trim();
}

export default function LeafletMap({
  latitude,
  longitude,
  namaAset = "",
  height,
}: LeafletMapProps) {
  const html = buildLeafletHtml(latitude, longitude, namaAset, DEFAULT_ZOOM);

  return (
    <View style={{ height, borderRadius: 12, overflow: "hidden" }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={["*"]}
        // Matikan zoom gesture WebView agar tidak konflik dengan Leaflet
        scalesPageToFit={false}
      />
    </View>
  );
}
