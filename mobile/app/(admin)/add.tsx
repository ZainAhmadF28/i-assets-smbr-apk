import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { assetService } from "@services/assetService";
import type { Kategori, Kondisi } from "@shared-types/index";
import InputField from "@components/ui/InputField";
import Button from "@components/ui/Button";

const KATEGORI_OPTIONS: Array<{ label: string; value: Kategori }> = [
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Kendaraan Dinas", value: "KENDARAAN_DINAS" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KONDISI_OPTIONS: Array<{ label: string; value: Kondisi }> = [
  { label: "Baik", value: "BAIK" },
  { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" },
];

export default function AddAssetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [form, setForm] = useState({
    nomorAset: "",
    namaAset: "",
    kategori: "BANGUNAN" as Kategori,
    quantity: "1",
    satuanUnit: "Unit",
    latitude: "",
    longitude: "",
    kondisi: "BAIK" as Kondisi,
    report: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.nomorAset.trim()) newErrors.nomorAset = "Nomor aset wajib diisi";
    if (!form.namaAset.trim()) newErrors.namaAset = "Nama aset wajib diisi";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      newErrors.quantity = "Jumlah harus berupa angka positif";
    if (form.latitude && isNaN(Number(form.latitude)))
      newErrors.latitude = "Latitude harus berupa angka";
    if (form.longitude && isNaN(Number(form.longitude)))
      newErrors.longitude = "Longitude harus berupa angka";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function getGPS() {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin Ditolak", "Akses lokasi diperlukan untuk fitur GPS.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setField("latitude", location.coords.latitude.toFixed(7));
      setField("longitude", location.coords.longitude.toFixed(7));
    } catch {
      Alert.alert("Error", "Gagal mendapatkan lokasi GPS.");
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const created = await assetService.create({
        nomorAset: form.nomorAset.trim(),
        namaAset: form.namaAset.trim(),
        kategori: form.kategori,
        quantity: Number(form.quantity),
        satuanUnit: form.satuanUnit.trim() || "Unit",
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        kondisi: form.kondisi,
        report: form.report.trim() || null,
      });

      // Upload foto jika ada
      if (photoUri) {
        await assetService.uploadPhoto(created.id, photoUri);
      }

      Alert.alert("Berhasil", "Aset berhasil ditambahkan!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Gagal menyimpan data aset";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Foto Aset */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Foto Aset</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              <TouchableOpacity className="mt-2 items-center" onPress={() => setPhotoUri(null)}>
                <Text className="text-red-500 text-sm">Hapus Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl items-center justify-center"
                onPress={takePhoto}
              >
                <Text className="text-2xl">📷</Text>
                <Text className="text-xs text-gray-500 mt-1">Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl items-center justify-center"
                onPress={pickPhoto}
              >
                <Text className="text-2xl">🖼️</Text>
                <Text className="text-xs text-gray-500 mt-1">Galeri</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Data Aset */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Data Aset</Text>
          <InputField label="Nomor Aset" required placeholder="Contoh: 141310000238" value={form.nomorAset} onChangeText={(v) => setField("nomorAset", v)} error={errors.nomorAset} />
          <InputField label="Nama Aset" required placeholder="Contoh: Pos Satpam Mess" value={form.namaAset} onChangeText={(v) => setField("namaAset", v)} error={errors.namaAset} multiline />

          {/* Kategori Picker */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Kategori <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {KATEGORI_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`px-4 py-2 rounded-xl border ${
                  form.kategori === opt.value ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
                }`}
                onPress={() => setField("kategori", opt.value)}
              >
                <Text className={`text-sm ${form.kategori === opt.value ? "text-white font-semibold" : "text-gray-600"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <InputField label="Jumlah" required placeholder="1" value={form.quantity} onChangeText={(v) => setField("quantity", v)} error={errors.quantity} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <InputField label="Satuan" placeholder="Unit" value={form.satuanUnit} onChangeText={(v) => setField("satuanUnit", v)} />
            </View>
          </View>
        </View>

        {/* Lokasi */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-gray-700">Lokasi GPS</Text>
            <TouchableOpacity
              className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg"
              onPress={getGPS}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#1a7fd4" />
              ) : (
                <Text className="text-blue-600 text-xs font-medium">📍 Ambil Otomatis</Text>
              )}
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <InputField label="Latitude" placeholder="-2.9761" value={form.latitude} onChangeText={(v) => setField("latitude", v)} error={errors.latitude} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <InputField label="Longitude" placeholder="104.7754" value={form.longitude} onChangeText={(v) => setField("longitude", v)} error={errors.longitude} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        {/* Kondisi */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Kondisi Aset</Text>
          <View className="flex-row gap-3">
            {KONDISI_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                className={`flex-1 py-3 rounded-xl items-center border ${
                  form.kondisi === opt.value
                    ? opt.value === "BAIK" ? "bg-green-600 border-green-600"
                      : opt.value === "RUSAK" ? "bg-amber-500 border-amber-500"
                      : "bg-red-600 border-red-600"
                    : "bg-white border-gray-200"
                }`}
                onPress={() => setField("kondisi", opt.value)}
              >
                <Text className={`text-sm font-semibold ${form.kondisi === opt.value ? "text-white" : "text-gray-600"}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Report */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <InputField
            label="Catatan / Report"
            placeholder="Contoh: Kunci pintu rusak — dalam perbaikan"
            value={form.report}
            onChangeText={(v) => setField("report", v)}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
        </View>

        <Button title="Simpan Aset" loading={loading} fullWidth onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
