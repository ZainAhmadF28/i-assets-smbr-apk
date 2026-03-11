import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { assetService } from "@services/assetService";
import type { Asset } from "@shared-types/index";
import { KATEGORI_LABEL } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";
import MapViewer from "@components/maps/MapViewer";
import Button from "@components/ui/Button";

export default function AdminAssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) loadAsset(id);
  }, [id]);

  async function loadAsset(assetId: string) {
    try {
      setLoading(true);
      const data = await assetService.getById(assetId);
      setAsset(data);
    } catch {
      Alert.alert("Error", "Aset tidak ditemukan.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePhoto() {
    Alert.alert("Update Foto", "Pilih sumber foto", [
      {
        text: "Kamera",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ["images"] });
          if (!result.canceled && result.assets[0] && id) {
            await uploadPhoto(result.assets[0].uri, id);
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ["images"] });
          if (!result.canceled && result.assets[0] && id) {
            await uploadPhoto(result.assets[0].uri, id);
          }
        },
      },
      { text: "Batal", style: "cancel" },
    ]);
  }

  async function uploadPhoto(uri: string, assetId: string) {
    setUploadingPhoto(true);
    try {
      const updated = await assetService.uploadPhoto(assetId, uri);
      setAsset(updated);
      Alert.alert("Berhasil", "Foto aset berhasil diperbarui");
    } catch {
      Alert.alert("Error", "Gagal mengupload foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Hapus Aset",
      `Yakin ingin menghapus aset "${asset?.namaAset}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            setDeleting(true);
            try {
              await assetService.remove(id);
              Alert.alert("Berhasil", "Aset berhasil dihapus", [
                { text: "OK", onPress: () => router.replace("/(admin)/dashboard") },
              ]);
            } catch {
              Alert.alert("Error", "Gagal menghapus aset");
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1a7fd4" />
      </View>
    );
  }

  if (!asset) return null;

  const photoUrl = assetService.getPhotoUrl(asset.gambar);
  const qrUrl = assetService.getQrUrl(asset.id);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Foto */}
      <View className="bg-white">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="w-full h-52" resizeMode="cover" />
        ) : (
          <View className="w-full h-52 bg-gray-100 items-center justify-center">
            <Text className="text-5xl">🏢</Text>
            <Text className="text-gray-400 text-xs mt-2">Foto belum tersedia</Text>
          </View>
        )}
        <TouchableOpacity
          className="absolute bottom-3 right-3 bg-blue-600 px-4 py-2 rounded-full flex-row items-center"
          onPress={handleUpdatePhoto}
          disabled={uploadingPhoto}
        >
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-xs font-semibold">📷 Update Foto</Text>
          )}
        </TouchableOpacity>
        {asset.fotoTimestamp && (
          <View className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <Text className="text-xs text-gray-400">
              📸 Foto diambil:{" "}
              {new Date(asset.fotoTimestamp).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 pt-4 pb-8">
        {/* Info */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-xs text-gray-400 font-mono">{asset.nomorAset}</Text>
          <Text className="text-xl font-bold text-gray-900 mt-0.5 mb-3">{asset.namaAset}</Text>
          <KondisiBadge kondisi={asset.kondisi} />
          <View className="mt-3 pt-3 border-t border-gray-50">
            <InfoRow label="Kategori" value={KATEGORI_LABEL[asset.kategori]} />
            <InfoRow label="Jumlah" value={`${asset.quantity} ${asset.satuanUnit}`} />
          </View>
        </View>

        {/* Report */}
        {asset.report && (
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Catatan Inventarisasi</Text>
            <Text className="text-gray-600 text-sm leading-relaxed">{asset.report}</Text>
          </View>
        )}

        {/* Lokasi */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Lokasi Aset</Text>
          {asset.latitude && asset.longitude && (
            <Text className="text-xs text-gray-400 mb-2">
              📍 {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
            </Text>
          )}
          <MapViewer latitude={asset.latitude} longitude={asset.longitude} namaAset={asset.namaAset} height={220} />
        </View>

        {/* QR Code */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm items-center">
          <Text className="text-sm font-semibold text-gray-700 mb-3">QR Code Aset</Text>
          <Image
            source={{ uri: qrUrl }}
            className="w-48 h-48"
            resizeMode="contain"
          />
          <Text className="text-xs text-gray-400 mt-2 font-mono">{asset.id}</Text>
        </View>

        {/* Admin Actions */}
        <Button
          title="✏️  Edit Data Aset"
          variant="secondary"
          fullWidth
          onPress={() => router.push(`/(admin)/asset/edit/${asset.id}`)}
          className="mb-3"
        />
        <Button
          title="🗑️  Hapus Aset"
          variant="danger"
          fullWidth
          loading={deleting}
          onPress={handleDelete}
        />

        <Text className="text-xs text-gray-400 text-center mt-4">
          Terakhir diperbarui:{" "}
          {new Date(asset.updatedAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-medium">{value}</Text>
    </View>
  );
}
