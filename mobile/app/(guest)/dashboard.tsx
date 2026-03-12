import React, { useState, useCallback } from "react";
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
import type { Asset } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

const KATEGORI_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Semua", value: "" },
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Infrastruktur", value: "INFRASTRUKTUR" },
  { label: "Kendaraan & Alat Berat", value: "KENDARAAN & ALAT BERAT" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KATEGORI_ICON: Record<string, FeatherIconName> = {
  "BANGUNAN": "home",
  "INFRASTRUKTUR": "settings",
  "KENDARAAN & ALAT BERAT": "truck",
  "PERLENGKAPAN": "tool",
  "TANAH": "map",
};

export default function GuestDashboardScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 50;

  // Reset to page 1 when search/filter changes
  useFocusEffect(
    useCallback(() => {
      setCurrentPage(1);
      setHasMore(true);
      loadAssets(false, 1);
    }, [search, filterKategori])
  );

  async function loadAssets(isRefresh = false, page = 1) {
    if (isRefresh) {
      setRefreshing(true);
      page = 1;
      setCurrentPage(1);
      setHasMore(true);
    } else if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await assetService.getAll({
        search: search || undefined,
        kategori: filterKategori || undefined,
        page,
        limit: PAGE_SIZE,
      });
      const dedupe = (arr: Asset[]) => {
        const seen = new Set<string>();
        return arr.filter((a) => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
      };
      if (page === 1) {
        setAssets(dedupe(result.data));
      } else {
        setAssets((prev) => dedupe([...prev, ...result.data]));
      }
      setTotal(result.total);
      setCurrentPage(page);
      setHasMore(result.data.length >= PAGE_SIZE);
    } catch {
      Alert.alert("Error", "Gagal memuat data aset");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore && !loading) {
      loadAssets(false, currentPage + 1);
    }
  }

  function renderAssetCard({ item, index }: { item: Asset; index: number }) {
    const catColor = "#135d3a";
    const catIcon = item.kelasAsetSig ? (KATEGORI_ICON[item.kelasAsetSig] ?? "box") : "box";
    const photoUrl = assetService.getPhotoUrl(item.fotoUrl);
    const isLeft = index % 2 === 0;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(guest)/asset/${item.id}`)}
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
              {item.kelasAsetSig || "Aset"}
            </Text>
            <KondisiBadge kondisi={item.kondisi} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#135d3a",
          paddingTop: Platform.OS === "ios" ? 50 : 32,
          paddingBottom: 14,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: "#135d3a",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Top row: back button + title */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "800", flex: 1 }}>
            Semua Aset
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }}>
            {total} item
          </Text>
        </View>

        {/* Search bar */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
          }}
        >
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 10,
              color: "white",
              fontSize: 14,
            }}
            placeholder="Cari nama atau nomor aset..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => loadAssets()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={{ paddingTop: 14, paddingBottom: 12 }}>
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#135d3a" />
                <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>Memuat lebih banyak...</Text>
              </View>
            ) : null
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
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        />
      )}
    </View>
  );
}
