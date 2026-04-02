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
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import type { Kondisi } from "@shared-types/index";
import InputField from "@components/ui/InputField";
import Button from "@components/ui/Button";

const KATEGORI_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Infrastruktur", value: "INFRASTRUKTUR" },
  { label: "Kendaraan & Alat Berat", value: "KENDARAAN & ALAT BERAT" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KONDISI_OPTIONS: Array<{ label: string; value: Kondisi }> = [
  { label: "Baik", value: "BAIK" },
  { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" },
  { label: "Hilang", value: "HILANG" },
];

export default function AddAssetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [form, setForm] = useState({
    nomorAset: "",
    namaAset: "",
    kodeKelas: "",
    kelasAsetSmbr: "",
    kelasAsetSig: "BANGUNAN",
    qty: "1",
    satuan: "Unit",
    latitude: "",
    longitude: "",
    site: "",
    kondisi: "BAIK" as Kondisi,
    keterangan: "",
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
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) < 1)
      newErrors.qty = "Jumlah harus berupa angka positif";
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
        kodeKelas: form.kodeKelas.trim() || undefined,
        kelasAsetSmbr: form.kelasAsetSmbr.trim() || undefined,
        kelasAsetSig: form.kelasAsetSig,
        qty: Number(form.qty),
        satuan: form.satuan.trim() || "Unit",
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        site: form.site.trim() || null,
        kondisi: form.kondisi,
        keterangan: form.keterangan.trim() || null,
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
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1, height: 96,
                  backgroundColor: "#f8fafc",
                  borderWidth: 2, borderStyle: "dashed", borderColor: "#e2e8f0",
                  borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onPress={takePhoto}
              >
                <Feather name="camera" size={22} color="#135d3a" />
                <Text style={{ color: "#64748b", fontSize: 12 }}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, height: 96,
                  backgroundColor: "#f8fafc",
                  borderWidth: 2, borderStyle: "dashed", borderColor: "#e2e8f0",
                  borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onPress={pickPhoto}
              >
                <Feather name="image" size={22} color="#135d3a" />
                <Text style={{ color: "#64748b", fontSize: 12 }}>Galeri</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Data Aset */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Data Aset</Text>
          <InputField label="Nomor Aset" required placeholder="Contoh: 141310000238" value={form.nomorAset} onChangeText={(v) => setField("nomorAset", v)} error={errors.nomorAset} />
          <InputField label="Nama Aset" required placeholder="Contoh: Pos Satpam Mess" value={form.namaAset} onChangeText={(v) => setField("namaAset", v)} error={errors.namaAset} multiline />

          <InputField label="Kode Kelas" placeholder="Contoh: 1413" value={form.kodeKelas} onChangeText={(v) => setField("kodeKelas", v)} error={errors.kodeKelas} />
          <InputField label="Kelas SMBR" placeholder="Contoh: Bangunan Tempat Kerja" value={form.kelasAsetSmbr} onChangeText={(v) => setField("kelasAsetSmbr", v)} error={errors.kelasAsetSmbr} />

          {/* Kategori Picker */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Kategori <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {KATEGORI_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: form.kelasAsetSig === opt.value ? "#135d3a" : "white",
                  borderWidth: 1,
                  borderColor: form.kelasAsetSig === opt.value ? "#135d3a" : "#e2e8f0",
                }}
                onPress={() => setField("kelasAsetSig", opt.value)}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: form.kelasAsetSig === opt.value ? "white" : "#64748b" }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <InputField label="Jumlah" required placeholder="1" value={form.qty} onChangeText={(v) => setField("qty", v)} error={errors.qty} keyboardType="numeric" />
            </View>
            <View className="flex-1">
              <InputField label="Satuan" placeholder="Unit" value={form.satuan} onChangeText={(v) => setField("satuan", v)} />
            </View>
          </View>
        </View>

        {/* Lokasi */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-semibold text-gray-700">Lokasi GPS</Text>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#e8f5ee", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}
              onPress={getGPS}
              disabled={gpsLoading}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#135d3a" />
              ) : (
                <>
                  <Feather name="map-pin" size={12} color="#135d3a" />
                  <Text style={{ color: "#135d3a", fontSize: 12, fontWeight: "600", marginLeft: 5 }}>Ambil Otomatis</Text>
                </>
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
          <InputField label="Site (Opsional)" placeholder="Contoh: Gedung Timur, Lantai 2" value={form.site} onChangeText={(v) => setField("site", v)} style={{ marginTop: 12 }} />
        </View>

        {/* Kondisi */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Kondisi Aset</Text>
          <View className="flex-row flex-wrap gap-3">
            {KONDISI_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={{ width: "47%" }}
                className={`py-3 rounded-xl items-center border ${
                  form.kondisi === opt.value
                    ? opt.value === "BAIK" ? "bg-green-600 border-green-600"
                      : opt.value === "RUSAK" ? "bg-amber-500 border-amber-500"
                      : opt.value === "RUSAK_BERAT" ? "bg-red-600 border-red-600"
                      : "bg-slate-500 border-slate-500"
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

        {/* Keterangan */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <InputField
            label="Catatan / Keterangan"
            placeholder="Contoh: Kunci pintu rusak — dalam perbaikan"
            value={form.keterangan}
            onChangeText={(v) => setField("keterangan", v)}
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
