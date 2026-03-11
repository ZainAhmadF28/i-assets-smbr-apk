import React from "react";
import { Stack } from "expo-router";

export default function GuestLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a7fd4" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#f3f4f6" },
      }}
    >
      <Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
      <Stack.Screen name="asset/[id]" options={{ title: "Detail Aset" }} />
    </Stack>
  );
}
