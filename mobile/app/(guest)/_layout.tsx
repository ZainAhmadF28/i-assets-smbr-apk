import React from "react";
import { Stack } from "expo-router";

export default function GuestLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#135d3a" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
        contentStyle: { backgroundColor: "#f3f4f6" },
      }}
    >
      <Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
      <Stack.Screen name="asset/[id]" options={{ title: "Detail Aset" }} />
      <Stack.Screen name="activity-log" options={{ title: "Log Aktivitas" }} />
    </Stack>
  );
}
