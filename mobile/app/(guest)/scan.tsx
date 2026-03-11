import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function GuestScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-gray-100" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 px-8">
        <Text className="text-2xl mb-2">📷</Text>
        <Text className="text-gray-800 font-bold text-lg mb-2 text-center">
          Izin Kamera Diperlukan
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          I-Asset membutuhkan akses kamera untuk memindai QR Code aset
        </Text>
        <TouchableOpacity
          className="bg-blue-600 px-8 py-3 rounded-xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Izinkan Akses Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    // QR Code berisi ID aset (string UUID/cuid)
    // Format yang diharapkan: plain asset ID atau URL mengandung /asset/<id>
    let assetId = data.trim();

    // Jika QR berisi URL, ekstrak ID dari path terakhir
    const match = data.match(/\/asset\/([^/?]+)/);
    if (match) assetId = match[1];

    if (!assetId) {
      Alert.alert("QR Tidak Valid", "QR Code ini tidak mengandung data aset yang valid.", [
        { text: "Scan Ulang", onPress: () => setScanned(false) },
      ]);
      return;
    }

    router.push(`/(guest)/asset/${assetId}`);
    // Reset setelah navigasi agar bisa scan lagi saat kembali
    setTimeout(() => setScanned(false), 1500);
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay frame */}
      <View className="flex-1 items-center justify-center">
        <View
          style={{
            width: 240,
            height: 240,
            borderRadius: 16,
            borderWidth: 3,
            borderColor: "#ffffff",
            backgroundColor: "transparent",
          }}
        />
        <Text className="text-white text-sm mt-4 opacity-80">
          Arahkan kamera ke QR Code pada aset
        </Text>
      </View>

      {scanned && (
        <View className="absolute bottom-12 left-0 right-0 items-center">
          <View className="bg-white px-6 py-3 rounded-full shadow">
            <Text className="text-blue-600 font-semibold">Membuka detail aset...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
