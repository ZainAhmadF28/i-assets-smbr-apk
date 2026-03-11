import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { assetService } from "@services/assetService";
import { authService } from "@services/authService";
import type { Asset, Kategori, Kondisi } from "@shared-types/index";
import { KATEGORI_LABEL, KONDISI_LABEL } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";

const KATEGORI_OPTIONS: Array<{ label: string; value: Kategori | "" }> = [
  { label: "Semua", value: "" },
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Kendaraan", value: "KENDARAAN_DINAS" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KONDISI_OPTIONS: Array<{ label: string; value: Kondisi | "" }> = [
  { label: "Semua", value: "" },
  { label: "Baik", value: "BAIK" },
  { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<Kategori | "">("");
  const [filterKondisi, setFilterKondisi] = useState<Kondisi | "">("");

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [search, filterKategori, filterKondisi])
  );

  async function loadAssets(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await assetService.getAll({
        search: search || undefined,
        kategori: filterKategori || undefined,
        kondisi: filterKondisi || undefined,
        limit: 50,
      });
      setAssets(result.data);
      setTotal(result.total);
    } catch {
      Alert.alert("Error", "Gagal memuat data aset");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          router.replace("/");
        },
      },
    ]);
  }

  function renderAssetCard({ item }: { item: Asset }) {
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm active:opacity-80"
        onPress={() => router.push(`/(admin)/asset/${item.id}`)}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-xs text-gray-400 font-mono">{item.nomorAset}</Text>
            <Text className="text-gray-900 font-semibold text-base mt-0.5 leading-tight">
              {item.namaAset}
            </Text>
          </View>
          <KondisiBadge kondisi={item.kondisi} />
        </View>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {KATEGORI_LABEL[item.kategori]}
          </Text>
          <Text className="text-xs text-gray-400">
            {item.quantity} {item.satuanUnit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Stats Bar */}
      <View className="bg-blue-600 px-4 pt-3 pb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-sm opacity-80">Total Aset Terdaftar</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-blue-200 text-sm">Logout</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-3xl font-black">{total}</Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-xl flex-row items-center px-4 shadow-sm border border-gray-100">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-gray-900 text-sm"
            placeholder="Cari nama atau nomor aset..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => loadAssets()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View className="px-4 pb-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={KATEGORI_OPTIONS}
          keyExtractor={(item) => `kat-${item.value}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-full mr-2 border ${
                filterKategori === item.value
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-200"
              }`}
              onPress={() => setFilterKategori(item.value)}
            >
              <Text
                className={`text-xs font-medium ${
                  filterKategori === item.value ? "text-white" : "text-gray-600"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Asset List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1a7fd4" />
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={renderAssetCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAssets(true)}
              colors={["#1a7fd4"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-5xl mb-3">📦</Text>
              <Text className="text-gray-500 font-medium">Belum ada aset terdaftar</Text>
              <Text className="text-gray-400 text-sm mt-1">Tap + untuk menambahkan aset baru</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB — Tambah Aset */}
      <View className="absolute bottom-6 right-6 flex-row gap-3">
        <TouchableOpacity
          className="bg-gray-700 w-12 h-12 rounded-full items-center justify-center shadow-lg"
          onPress={() => router.push("/(admin)/scan")}
        >
          <Text className="text-white text-xl">📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          onPress={() => router.push("/(admin)/add")}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
