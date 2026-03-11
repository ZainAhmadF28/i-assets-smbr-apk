import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#135d3a" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#f3f4f6" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Login Admin", headerShown: false }} />
        <Stack.Screen name="(guest)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
