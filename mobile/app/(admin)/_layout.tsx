import React from "react";
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#135d3a" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#f3f4f6" },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="database" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: "Tambah Aset" }} />
      <Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
      <Stack.Screen name="asset/[id]" options={{ title: "Detail Aset" }} />
      <Stack.Screen name="asset/edit/[id]" options={{ title: "Edit Aset" }} />
    </Stack>
  );
}
