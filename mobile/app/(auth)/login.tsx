import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { authService } from "@services/authService";

const GREEN = "#135d3a";

export default function LoginScreen() {
  const router = useRouter();
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
      await authService.login(email.trim(), password);
      router.replace("/(admin)/home");
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
            paddingVertical: 24, // ← dikurangi dari 48
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 0 }}>
            <Image
              source={require("../../assets/icon.png")}
              style={{ width: 300, height: 300, marginBottom: 0 }} // ← dikurangi dari 130/16
              resizeMode="contain"
            />
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.4 }}>
              Admin Dashboard
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Masuk untuk mengelola aset
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
                placeholder="admin@example.com"
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

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Feather name="arrow-left" size={14} color="#9ca3af" />
            <Text style={{ color: "#9ca3af", fontSize: 13 }}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}