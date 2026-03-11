import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { authService } from "@services/authService";

export default function AdminLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService.isLoggedIn().then((loggedIn) => {
      if (!loggedIn) {
        router.replace("/(auth)/login");
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1a7fd4" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a7fd4" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#f3f4f6" },
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: "I-Asset SMBR", headerBackVisible: false }} />
      <Stack.Screen name="add" options={{ title: "Tambah Aset" }} />
      <Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
      <Stack.Screen name="asset/[id]" options={{ title: "Detail Aset" }} />
      <Stack.Screen name="asset/edit/[id]" options={{ title: "Edit Aset" }} />
    </Stack>
  );
}
