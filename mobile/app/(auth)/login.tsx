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
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "@services/authService";
import InputField from "@components/ui/InputField";
import Button from "@components/ui/Button";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email wajib diisi";
    if (!password) newErrors.password = "Password wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      router.replace("/(admin)/dashboard");
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
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a7fd4" />

      {/* Header */}
      <View className="bg-blue-600 pt-14 pb-10 px-6 items-center">
        <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-3">
          <Text className="text-blue-600 text-3xl font-black">IA</Text>
        </View>
        <Text className="text-white text-xl font-bold">I-Asset SMBR</Text>
        <Text className="text-blue-200 text-sm">Login Admin</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-8">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Selamat Datang</Text>
          <Text className="text-gray-500 text-sm mb-8">
            Masuk dengan akun Admin untuk mengelola data aset
          </Text>

          <InputField
            label="Email"
            required
            placeholder="Masukkan email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <InputField
            label="Password"
            required
            placeholder="Masukkan password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Login"
            loading={loading}
            fullWidth
            onPress={handleLogin}
            className="mt-2"
          />

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-blue-600 text-sm">← Kembali ke beranda</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
