import "../global.css";
import React, { useEffect, useState, useRef } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NotificationProvider } from "../context/NotificationContext";

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

const { width: SCREEN_W } = Dimensions.get("window");

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Animations
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Spin interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    async function prepare() {
      // Hide native splash immediately
      await SplashScreen.hideAsync();

      // Animate icon entrance
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Start spinner
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Simulate loading time (min 2.5s)
      await new Promise((resolve) => setTimeout(resolve, 2500));
      setAppReady(true);
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    // Fade out splash
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setSplashDone(true);
    });
  }, [appReady]);

  if (!splashDone) {
    return (
      <>
        <StatusBar style="dark" />
        <Animated.View style={[styles.splashContainer, { opacity: fadeOut }]}>
          {/* Icon */}
          <Animated.View
            style={{
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            }}
          >
            <Image
              source={require("../assets/icon.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Spinner */}
          <View style={styles.spinnerWrap}>
            <Animated.View
              style={[
                styles.spinner,
                { transform: [{ rotate: spin }] },
              ]}
            />
          </View>
        </Animated.View>
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <SafeAreaProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </SafeAreaProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
  },
  spinnerWrap: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#e2e8f0",
    borderTopColor: "#135d3a",
  },
});
