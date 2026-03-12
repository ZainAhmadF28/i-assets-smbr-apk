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
  Modal,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import { authService } from "@services/authService";
import type { Asset, Kondisi } from "@shared-types/index";
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

const KONDISI_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Semua Kondisi", value: "" },
  { label: "Baik", value: "BAIK" },
  { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" },
  { label: "Hilang", value: "HILANG" },
  { label: "Belum Dicek", value: "BELUM_DICEK" },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { kondisi: kondisiParam } = useLocalSearchParams<{ kondisi?: string }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [filterKondisi, setFilterKondisi] = useState<string>(kondisiParam || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const PAGE_SIZE = 50;
  const activeFilterCount = (filterKategori ? 1 : 0) + (filterKondisi ? 1 : 0);

  // Sync kondisi param from navigation
  useEffect(() => {
    if (kondisiParam) setFilterKondisi(kondisiParam);
  }, [kondisiParam]);

  // Reset to page 1 when search/filter changes
  useFocusEffect(
    useCallback(() => {
      setCurrentPage(1);
      setHasMore(true);
      loadAssets(false, 1);
    }, [search, filterKategori, filterKondisi])
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
        kondisi: (filterKondisi as Kondisi) || undefined,
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
    const catIcon = item.kelasAsetSig ? (KATEGORI_ICON[item.kelasAsetSig] ?? "box") : "box";
    const photoUrl = assetService.getPhotoUrl(item.fotoUrl);
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
            Aset
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }}>
            {total} item
          </Text>
        </View>

        {/* Search bar + Filter button */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              flex: 1,
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
              placeholder="Cari aset..."
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
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: activeFilterCount > 0 ? "white" : "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="sliders" size={18} color={activeFilterCount > 0 ? "#135d3a" : "rgba(255,255,255,0.8)"} />
            {activeFilterCount > 0 && (
              <View style={{
                position: "absolute", top: -4, right: -4,
                backgroundColor: "#ef4444", borderRadius: 10,
                width: 18, height: 18, alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "800" }}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
          {filterKategori !== "" && (
            <TouchableOpacity
              onPress={() => setFilterKategori("")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "#135d3a", borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6, gap: 6,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                {KATEGORI_OPTIONS.find(o => o.value === filterKategori)?.label}
              </Text>
              <Feather name="x" size={12} color="white" />
            </TouchableOpacity>
          )}
          {filterKondisi !== "" && (
            <TouchableOpacity
              onPress={() => setFilterKondisi("")}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "#1e293b", borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 6, gap: 6,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                {KONDISI_OPTIONS.find(o => o.value === filterKondisi)?.label}
              </Text>
              <Feather name="x" size={12} color="white" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "80%",
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1e293b" }}>Filter Aset</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
                <Feather name="x" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {/* Kategori Section */}
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Kategori</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {KATEGORI_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={`fk-${opt.value}`}
                    onPress={() => setFilterKategori(opt.value)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: filterKategori === opt.value ? "#135d3a" : "#f8fafc",
                      borderWidth: 1,
                      borderColor: filterKategori === opt.value ? "#135d3a" : "#e2e8f0",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: filterKategori === opt.value ? "white" : "#475569" }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Kondisi Section */}
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Kondisi</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {KONDISI_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={`fc-${opt.value}`}
                    onPress={() => setFilterKondisi(opt.value)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: filterKondisi === opt.value ? "#1e293b" : "#f8fafc",
                      borderWidth: 1,
                      borderColor: filterKondisi === opt.value ? "#1e293b" : "#e2e8f0",
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: filterKondisi === opt.value ? "white" : "#475569" }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={{ flexDirection: "row", gap: 10, padding: 20, paddingBottom: Platform.OS === "ios" ? 36 : 20, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
              <TouchableOpacity
                onPress={() => { setFilterKategori(""); setFilterKondisi(""); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center" }}
              >
                <Text style={{ color: "#64748b", fontWeight: "700", fontSize: 14 }}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilter(false)}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: "#135d3a", alignItems: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Terapkan Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
