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
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import type { Asset } from "@shared-types/index";
import { KATEGORI_LABEL } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";
import MapViewer from "@components/maps/MapViewer";

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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#135d3a" />
      </View>
    );
  }

  if (!asset) return null;

  const photoUrl = assetService.getPhotoUrl(asset.gambar);
  const qrUrl = assetService.getQrUrl(asset.id);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Foto */}
      <View style={{ backgroundColor: "white" }}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", height: 220, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" }}>
            <Feather name="image" size={48} color="#135d3a" />
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>Foto belum tersedia</Text>
          </View>
        )}
        <TouchableOpacity
          style={{
            position: "absolute", bottom: 12, right: 12,
            backgroundColor: "#135d3a",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={handleUpdatePhoto}
          disabled={uploadingPhoto}
        >
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="camera" size={13} color="white" />
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>Update Foto</Text>
            </>
          )}
        </TouchableOpacity>
        {asset.fotoTimestamp && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f8fafc", borderTopWidth: 1, borderTopColor: "#f1f5f9", flexDirection: "row", alignItems: "center" }}>
            <Feather name="camera" size={11} color="#94a3b8" />
            <Text style={{ color: "#94a3b8", fontSize: 11, marginLeft: 6 }}>
              Foto diambil:{" "}
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
        <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 12 }}>Lokasi Aset</Text>
          {asset.namaLokasi && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Feather name="navigation" size={12} color="#135d3a" />
              <Text style={{ color: "#334155", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                {asset.namaLokasi}
              </Text>
            </View>
          )}
          {asset.latitude && asset.longitude && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Feather name="map-pin" size={12} color="#135d3a" />
              <Text style={{ color: "#64748b", fontSize: 11, marginLeft: 6 }}>
                {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
              </Text>
            </View>
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
        <TouchableOpacity
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            backgroundColor: "#f1f5f9",
            borderRadius: 16, padding: 16, marginBottom: 12,
          }}
          onPress={() => router.push(`/(admin)/asset/edit/${asset.id}`)}
        >
          <Feather name="edit-2" size={16} color="#1e293b" />
          <Text style={{ color: "#1e293b", fontWeight: "700", fontSize: 15, marginLeft: 8 }}>Edit Data Aset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            backgroundColor: deleting ? "#fca5a5" : "#ef4444",
            borderRadius: 16, padding: 16,
          }}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Feather name="trash-2" size={16} color="white" />
              <Text style={{ color: "white", fontWeight: "700", fontSize: 15, marginLeft: 8 }}>Hapus Aset</Text>
            </>
          )}
        </TouchableOpacity>

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
