import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

export default function AdminScanScreen() {
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

    let assetId = data.trim();
    const match = data.match(/\/asset\/([^/?]+)/);
    if (match) assetId = match[1];

    if (!assetId) {
      Alert.alert("QR Tidak Valid", "QR Code ini tidak mengandung data aset yang valid.", [
        { text: "Scan Ulang", onPress: () => setScanned(false) },
      ]);
      return;
    }

    // Admin diarahkan ke halaman detail admin
    router.push(`/(admin)/asset/${assetId}`);
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
          Scan QR Code aset untuk membuka detail & edit
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
