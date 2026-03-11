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
import { assetService } from "@services/assetService";
import type { Asset } from "@shared-types/index";
import { KATEGORI_LABEL } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";
import MapViewer from "@components/maps/MapViewer";

export default function GuestAssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadAsset(id);
  }, [id]);

  async function loadAsset(assetId: string) {
    try {
      setLoading(true);
      setError(null);
      const data = await assetService.getById(assetId);
      setAsset(data);
    } catch {
      setError("Aset tidak ditemukan atau server tidak dapat dijangkau.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1a7fd4" />
        <Text className="text-gray-500 mt-3 text-sm">Memuat data aset...</Text>
      </View>
    );
  }

  if (error || !asset) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-5xl mb-4">⚠️</Text>
        <Text className="text-gray-800 font-bold text-lg text-center mb-2">
          {error ?? "Aset tidak ditemukan"}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photoUrl = assetService.getPhotoUrl(asset.gambar);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Foto Aset */}
      <View className="bg-white">
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            className="w-full h-52"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52 bg-gray-100 items-center justify-center">
            <Text className="text-5xl">🏢</Text>
            <Text className="text-gray-400 text-xs mt-2">Foto belum tersedia</Text>
          </View>
        )}
        {asset.fotoTimestamp && (
          <View className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <Text className="text-xs text-gray-400">
              📸 Foto diambil:{" "}
              {new Date(asset.fotoTimestamp).toLocaleString("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 pt-4 pb-8">
        {/* Nama & Status */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-xs text-gray-400 uppercase tracking-wide">Nomor Aset</Text>
          <Text className="text-sm font-mono text-gray-600 mb-2">{asset.nomorAset}</Text>
          <Text className="text-xl font-bold text-gray-900 mb-3">{asset.namaAset}</Text>
          <KondisiBadge kondisi={asset.kondisi} />
        </View>

        {/* Info Grid */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Informasi Aset</Text>
          <InfoRow label="Kategori" value={KATEGORI_LABEL[asset.kategori]} />
          <InfoRow label="Jumlah" value={`${asset.quantity} ${asset.satuanUnit}`} />
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
          <Text className="text-sm font-semibold text-gray-700 mb-3">Lokasi Aset</Text>
          {asset.latitude && asset.longitude && (
            <Text className="text-xs text-gray-400 mb-2">
              📍 {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
            </Text>
          )}
          <MapViewer
            latitude={asset.latitude}
            longitude={asset.longitude}
            namaAset={asset.namaAset}
            height={220}
          />
        </View>

        {/* Timestamp update */}
        <Text className="text-xs text-gray-400 text-center mt-2">
          Terakhir diperbarui:{" "}
          {new Date(asset.updatedAt).toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50 last:border-0">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-medium">{value}</Text>
    </View>
  );
}
