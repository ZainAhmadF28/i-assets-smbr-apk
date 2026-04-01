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
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NotificationProvider } from "../context/NotificationContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Feather } from "@expo/vector-icons";

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

const { width: SCREEN_W } = Dimensions.get("window");
const GREEN = "#135d3a";

// ─── Login Form (same UI as old login.tsx) ─────────────────────────────────
function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Email atau password salah";
      Alert.alert("Login Gagal", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 0 }}>
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 300, height: 300, marginBottom: 0 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.4 }}>
              Login
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Masuk untuk menggunakan aplikasi
            </Text>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              Email
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor:
                  errors.email ? "#ef4444"
                    : focusedField === "email" ? GREEN
                      : "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 50,
                backgroundColor: "#fafafa",
              }}
            >
              <Feather name="mail" size={16} color={GREEN} style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined })); }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="email@example.com"
                placeholderTextColor="#d1d5db"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ flex: 1, color: "#111827", fontSize: 14 }}
              />
            </View>
            {errors.email && (
              <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
              Password
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor:
                  errors.password ? "#ef4444"
                    : focusedField === "password" ? GREEN
                      : "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 50,
                backgroundColor: "#fafafa",
              }}
            >
              <Feather name="lock" size={16} color={GREEN} style={{ marginRight: 10 }} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor="#d1d5db"
                style={{ flex: 1, color: "#111827", fontSize: 14 }}
              />
              <TouchableOpacity
                onPress={() => setShowPw((p) => !p)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={{ alignSelf: "flex-end", marginBottom: 24 }}>
            <Text style={{ color: GREEN, fontSize: 12, fontWeight: "600" }}>
              Lupa Password?
            </Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 14,
              backgroundColor: GREEN,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Feather name="log-in" size={16} color="#ffffff" />
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700" }}>
              {loading ? "Memuat..." : "Masuk"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Inner App (uses auth context) ──────────────────────────────────────────
function AppContent() {
  const { isLoggedIn, loading: authLoading } = useAuth();
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
      await SplashScreen.hideAsync();

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

      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      await new Promise((resolve) => setTimeout(resolve, 2500));
      setAppReady(true);
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setSplashDone(true);
    });
  }, [appReady]);

  // Preloader
  if (!splashDone) {
    return (
      <>
        <StatusBar style="dark" />
        <Animated.View style={[styles.splashContainer, { opacity: fadeOut }]}>
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

  // After preloader: check login
  if (authLoading) {
    return null; // brief moment while checking AsyncStorage
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  // Logged in → normal app
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
            <Stack.Screen name="(guest)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          </Stack>
        </NotificationProvider>
      </SafeAreaProvider>
    </SafeAreaView>
  );
}

// ─── Root Layout ────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
