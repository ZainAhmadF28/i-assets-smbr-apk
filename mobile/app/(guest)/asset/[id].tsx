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
import { Feather } from "@expo/vector-icons";
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#135d3a" />
        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 13 }}>Memuat data aset...</Text>
      </View>
    );
  }

  if (error || !asset) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", paddingHorizontal: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Feather name="alert-circle" size={32} color="#ef4444" />
        </View>
        <Text style={{ color: "#1e293b", fontWeight: "700", fontSize: 17, textAlign: "center", marginBottom: 8 }}>
          {error ?? "Aset tidak ditemukan"}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 12, backgroundColor: "#135d3a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photoUrl = assetService.getPhotoUrl(asset.gambar);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Foto Aset */}
      <View style={{ backgroundColor: "white" }}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 216 }} resizeMode="cover" />
        ) : (
          <View style={{ width: "100%", height: 216, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" }}>
            <Feather name="image" size={48} color="#135d3a" />
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>Foto belum tersedia</Text>
          </View>
        )}
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
