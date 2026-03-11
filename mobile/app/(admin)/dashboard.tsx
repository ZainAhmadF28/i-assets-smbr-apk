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
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import { authService } from "@services/authService";
import type { Asset, Kategori } from "@shared-types/index";
import { KATEGORI_LABEL } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

const KATEGORI_OPTIONS: Array<{ label: string; value: Kategori | "" }> = [
  { label: "Semua", value: "" },
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Kendaraan", value: "KENDARAAN_DINAS" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KATEGORI_ICON: Record<string, FeatherIconName> = {
  BANGUNAN: "home",
  KENDARAAN_DINAS: "truck",
  PERLENGKAPAN: "tool",
  TANAH: "map",
};

export default function DashboardScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<Kategori | "">("");

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [search, filterKategori])
  );

  async function loadAssets(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await assetService.getAll({
        search: search || undefined,
        kategori: filterKategori || undefined,
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

  function renderAssetCard({ item, index }: { item: Asset; index: number }) {
    const catColor = "#135d3a";
    const catIcon = KATEGORI_ICON[item.kategori] ?? "box";
    const photoUrl = assetService.getPhotoUrl(item.gambar);
    const isLeft = index % 2 === 0;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(admin)/asset/${item.id}`)}
        activeOpacity={0.82}
        style={{
          width: CARD_W,
          backgroundColor: "white",
          borderRadius: 20,
          marginLeft: isLeft ? 16 : 8,
          marginRight: isLeft ? 8 : 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#f1f5f9",
          shadowColor: "#94a3b8",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 3,
          overflow: "hidden",
        }}
      >
        {/* Thumbnail */}
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: "100%", height: CARD_W * 0.72 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: "100%",
            height: CARD_W * 0.72,
            backgroundColor: catColor + "18",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Feather name={catIcon} size={32} color={catColor} />
          </View>
        )}

        {/* Info */}
        <View style={{ padding: 12 }}>
          <Text
            style={{ color: "#1e293b", fontWeight: "700", fontSize: 13, lineHeight: 18, marginBottom: 6 }}
            numberOfLines={2}
          >
            {item.namaAset}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 10, marginBottom: 8 }} numberOfLines={1}>
            #{item.nomorAset}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{
              color: catColor,
              fontSize: 9,
              fontWeight: "700",
              backgroundColor: catColor + "18",
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
              overflow: "hidden",
            }}>
              {KATEGORI_LABEL[item.kategori]}
            </Text>
            <KondisiBadge kondisi={item.kondisi} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#f1f5f9",
            shadowColor: "#94a3b8",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Feather name="arrow-left" size={20} color="#135d3a" />
        </TouchableOpacity>
        <View style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: "#f1f5f9",
          shadowColor: "#94a3b8",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <Feather name="search" size={16} color="#94a3b8" />
          <TextInput
            style={{ flex: 1, paddingVertical: 13, paddingHorizontal: 10, color: "#1e293b", fontSize: 14 }}
            placeholder="Cari nama atau nomor aset..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => loadAssets()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={{ paddingBottom: 12 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={KATEGORI_OPTIONS}
          keyExtractor={(item) => `kat-${item.value}`}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filterKategori === item.value ? "#135d3a" : "white",
                borderWidth: 1,
                borderColor: filterKategori === item.value ? "#135d3a" : "#e2e8f0",
              }}
              onPress={() => setFilterKategori(item.value)}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: filterKategori === item.value ? "white" : "#64748b" }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Asset List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#135d3a" />
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderAssetCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAssets(true)}
              colors={["#135d3a"]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 24,
                backgroundColor: "#e8f5ee",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Feather name="inbox" size={32} color="#135d3a" />
              </View>
              <Text style={{ color: "#1e293b", fontWeight: "700", fontSize: 16 }}>Belum ada aset</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Tap + untuk menambahkan aset baru</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
        />
      )}

      {/* FAB */}
      <View style={{
        position: "absolute",
        bottom: Platform.OS === "android" ? 20 : 36,
        right: 20,
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-end",
      }}>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/scan")}
          style={{
            width: 48, height: 48, borderRadius: 16,
            backgroundColor: "#1e293b",
            alignItems: "center", justifyContent: "center",
            shadowColor: "#1e293b",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
          }}
        >
          <Feather name="camera" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/add")}
          style={{
            width: 56, height: 56, borderRadius: 20,
            backgroundColor: "#135d3a",
            alignItems: "center", justifyContent: "center",
            shadowColor: "#135d3a",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
          }}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
