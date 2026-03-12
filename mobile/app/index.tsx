import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/apiConfig";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;

type AssetUpdate = {
  id: string;
  namaAset: string;
  nomorAset: string;
  kelasAsetSig: string | null;
  kondisi: string;
  fotoUrl: string | null;
  updatedAt: string;
};

type AssetStats = {
  total: number;
  kondisi: { BAIK: number; RUSAK: number; RUSAK_BERAT: number; HILANG: number };
} | null;

const KELAS_ASET_COLOR: Record<string, string> = {
  BANGUNAN: "#0ea5e9",
  INFRASTRUKTUR: "#f59e0b",
  "KENDARAAN & ALAT BERAT": "#8b5cf6",
  PERLENGKAPAN: "#10b981",
  TANAH: "#ec4899",
};

const KONDISI_COLOR: Record<string, string> = {
  BAIK: "#135d3a",
  RUSAK: "#f59e0b",
  RUSAK_BERAT: "#ef4444",
  HILANG: "#64748b",
};

const KONDISI_LABEL: Record<string, string> = {
  BAIK: "Baik",
  RUSAK: "Rusak",
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
};

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AssetUpdate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stats, setStats] = useState<AssetStats>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentAssets, setRecentAssets] = useState<AssetUpdate[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderRef = useRef<FlatList<AssetUpdate>>(null);

  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assets?search=${encodeURIComponent(query.trim())}&limit=6&page=1`
      );
      const json = await res.json();
      if (json?.data) {
        setSearchResults(json.data);
        setShowDropdown(true);
      }
    } catch (_) {
      // silent fail
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const onSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(() => {
      fetchSearchResults(text);
    }, 200);
  };

  const fetchRecentAssets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/assets?limit=8&page=1`);
      const json = await res.json();
      if (json?.data) setRecentAssets(json.data);
    } catch (_) {
      // silent fail
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/assets/stats`);
      const json = await res.json();
      if (json?.total !== undefined) setStats(json);
    } catch (_) {
      // silent fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    fetchRecentAssets();
    const interval = setInterval(fetchRecentAssets, 60000);
    return () => clearInterval(interval);
  }, [fetchRecentAssets]);

  useEffect(() => {
    if (recentAssets.length < 2) return;
    const timer = setInterval(() => {
      setSliderIndex((prev) => {
        const next = (prev + 1) % recentAssets.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [recentAssets.length]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchSearchResults(searchQuery);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100, backgroundColor: "transparent" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header with Background Image */}
        <ImageBackground
          source={require("../assets/background.png")}
          className="w-full"
          style={{ height: 220 }}
          resizeMode="stretch"
        >
          <View
            className="pt-14 px-5"
            style={{ paddingBottom: 20 }}
          >
            <View style={{ height: 10 }} />
          </View>
        </ImageBackground>

        {/* White rounded content area */}
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -30,
            paddingTop: 20,
          }}
        >

        {/* Search Bar + Dropdown */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, zIndex: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: showDropdown && searchResults.length > 0 ? 16 : 16,
              paddingHorizontal: 16,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: showDropdown && searchResults.length > 0 ? "#135d3a" : "#e2e8f0",
              shadowColor: "#94a3b8",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Feather name="search" size={18} color={showDropdown ? "#135d3a" : "#94a3b8"} />
            <TextInput
              placeholder="Cari nama atau nomor aset..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={onSearchChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={{
                flex: 1,
                marginLeft: 10,
                fontSize: 14,
                color: "#1e293b",
                paddingVertical: 12,
              }}
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#135d3a" style={{ marginRight: 8 }} />
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Feather name="x-circle" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showDropdown && searchQuery.trim().length > 0 && (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                marginTop: 8,
                borderWidth: 1,
                borderColor: "#f1f5f9",
                shadowColor: "#94a3b8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 8,
                overflow: "hidden",
              }}
            >
              {searchResults.length === 0 && !searchLoading ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Feather name="search" size={24} color="#cbd5e1" />
                  <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>
                    Tidak ada aset yang cocok
                  </Text>
                </View>
              ) : (
                searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setShowDropdown(false);
                      router.push(`/(admin)/asset/${item.id}` as any);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                      borderBottomColor: "#f1f5f9",
                    }}
                  >
                    {/* Thumbnail */}
                    {item.fotoUrl ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${item.fotoUrl}` }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: "#f1f5f9",
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: "#e8f5ee",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="box" size={20} color="#135d3a" />
                      </View>
                    )}

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{ color: "#1e293b", fontWeight: "700", fontSize: 13 }}
                        numberOfLines={1}
                      >
                        {item.namaAset}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                        <Text style={{ color: "#94a3b8", fontSize: 11 }}>
                          #{item.nomorAset}
                        </Text>
                        <View
                          style={{
                            marginLeft: 8,
                            backgroundColor: (KONDISI_COLOR[item.kondisi] ?? "#135d3a") + "18",
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: KONDISI_COLOR[item.kondisi] ?? "#135d3a",
                              fontSize: 9,
                              fontWeight: "700",
                            }}
                          >
                            {KONDISI_LABEL[item.kondisi] ?? item.kondisi}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Feather name="chevron-right" size={14} color="#cbd5e1" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Asset Statistics Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              borderRadius: 20,
              backgroundColor: "white",
              padding: 18,
              borderWidth: 1,
              borderColor: "#f1f5f9",
              shadowColor: "#94a3b8",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 14,
              elevation: 6,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View
                style={{
                  backgroundColor: "#135d3a",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Feather name="bar-chart-2" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={{ color: "#1e293b", fontWeight: "800", fontSize: 14 }}>
                  Statistik Aset
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 11 }}>
                  Ringkasan kondisi aset
                </Text>
              </View>
            </View>

            {statsLoading ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#135d3a" />
              </View>
            ) : stats ? (
              <>
                {/* Total */}
                <View
                  style={{
                    backgroundColor: "#135d3a",
                    borderRadius: 14,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    shadowColor: "#135d3a",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <View style={{ marginRight: 12, backgroundColor: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 10 }}>
                    <Feather name="box" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" }}>
                      Total Aset Tercatat
                    </Text>
                    <Text style={{ color: "white", fontSize: 26, fontWeight: "900", marginTop: -2 }}>
                      {stats.total}
                    </Text>
                  </View>
                </View>

                {/* Per Kondisi */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {/* Baik */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Feather name="check-circle" size={18} color="#135d3a" style={{ marginBottom: 4 }} />
                    <Text style={{ color: "#135d3a", fontSize: 18, fontWeight: "900" }}>
                      {stats.kondisi.BAIK}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textAlign: "center" }}>
                      Baik
                    </Text>
                  </View>

                  {/* Rusak */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Feather name="alert-triangle" size={18} color="#135d3a" style={{ marginBottom: 4 }} />
                    <Text style={{ color: "#135d3a", fontSize: 18, fontWeight: "900" }}>
                      {stats.kondisi.RUSAK}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textAlign: "center" }}>
                      Rusak
                    </Text>
                  </View>

                  {/* Rusak Berat */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Feather name="x-circle" size={18} color="#135d3a" style={{ marginBottom: 4 }} />
                    <Text style={{ color: "#135d3a", fontSize: 18, fontWeight: "900" }}>
                      {stats.kondisi.RUSAK_BERAT}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textAlign: "center" }}>
                      Rsk. Berat
                    </Text>
                  </View>

                  {/* Hilang */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Feather name="help-circle" size={18} color="#135d3a" style={{ marginBottom: 4 }} />
                    <Text style={{ color: "#135d3a", fontSize: 18, fontWeight: "900" }}>
                      {stats.kondisi.HILANG}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2, textAlign: "center" }}>
                      Hilang
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Data tidak tersedia</Text>
            )}
          </View>
        </View>

        {/* Action Cards */}
        <View className="px-4 mt-5">
          <View
            className="bg-white rounded-3xl overflow-hidden"
            style={{
              shadowColor: "#94a3b8",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: "#f1f5f9",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(admin)/scan")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#135d3a" }}
              >
                <Feather name="maximize" size={22} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-bold text-slate-800 text-[15px]">
                  Scan QR Code
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Identifikasi aset via kamera HP
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(admin)/dashboard")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 20,
              }}
              activeOpacity={0.7}
            >
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#135d3a" }}
              >
                <Feather name="list" size={22} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-bold text-slate-800 text-[15px]">
                  Lihat Semua Aset
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Telusuri katalog aset perusahaan
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Update Terbaru Slider */}
        <View style={{ marginTop: 20, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 2,
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            Update Terbaru
          </Text>

          {assetsLoading ? (
            <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#135d3a" />
            </View>
          ) : recentAssets.length === 0 ? (
            <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
              <Feather name="inbox" size={32} color="#cbd5e1" />
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>
                Belum ada data aset
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={sliderRef}
                data={recentAssets}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                snapToInterval={CARD_W + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / (CARD_W + 12)
                  );
                  setSliderIndex(Math.max(0, Math.min(idx, recentAssets.length - 1)));
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => router.push("/(admin)/dashboard")}
                    style={{
                      width: CARD_W,
                      backgroundColor: "white",
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#f1f5f9",
                      shadowColor: "#94a3b8",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {item.fotoUrl ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${item.fotoUrl}` }}
                        style={{ width: "100%", height: 140 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 140,
                          backgroundColor: "#e8f5ee",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="image" size={36} color="#135d3a" />
                      </View>
                    )}
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <View
                          style={{
                            backgroundColor: (item.kelasAsetSig ? KELAS_ASET_COLOR[item.kelasAsetSig] : "#135d3a") + "22",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginRight: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: item.kelasAsetSig ? KELAS_ASET_COLOR[item.kelasAsetSig] : "#135d3a",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {item.kelasAsetSig || "Aset"}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: (KONDISI_COLOR[item.kondisi] ?? "#135d3a") + "22",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: KONDISI_COLOR[item.kondisi] ?? "#135d3a",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {KONDISI_LABEL[item.kondisi] ?? item.kondisi}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{ color: "#1e293b", fontWeight: "700", fontSize: 14, marginBottom: 6 }}
                        numberOfLines={1}
                      >
                        {item.namaAset}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Feather name="clock" size={11} color="#94a3b8" />
                        <Text style={{ color: "#94a3b8", fontSize: 11, marginLeft: 4 }}>
                          {timeAgo(item.updatedAt)}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Text style={{ color: "#cbd5e1", fontSize: 10 }}>
                          #{item.nomorAset}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
              {recentAssets.length > 1 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginTop: 14,
                    gap: 6,
                  }}
                >
                  {recentAssets.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i === sliderIndex ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === sliderIndex ? "#135d3a" : "#d1fae5",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <Text className="text-center text-[10px] text-slate-300 mt-8 mb-2">
          © 2026 PT Semen Baturaja (Persero) Tbk
        </Text>

        </View>{/* end white rounded wrapper */}
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        className="bg-white border-t border-slate-100"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Platform.OS === "android" ? 12 : 28,
          paddingTop: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            paddingHorizontal: 8,
          }}
        >
          {/* Beranda */}
          <TouchableOpacity className="items-center px-3 py-1">
            <Feather name="home" size={20} color="#135d3a" />
            <Text
              className="text-[10px] font-medium"
              style={{ color: "#135d3a" }}
            >
              Beranda
            </Text>
          </TouchableOpacity>

          {/* Aset */}
          <TouchableOpacity
            className="items-center px-3 py-1"
            onPress={() => router.push("/(admin)/dashboard")}
          >
            <Feather name="box" size={20} color="#94a3b8" />
            <Text className="text-[10px] font-medium text-slate-400">Aset</Text>
          </TouchableOpacity>

          {/* Scan Center elevated */}
          <View className="items-center" style={{ marginTop: -28 }}>
            <TouchableOpacity
              onPress={() => router.push("/(admin)/scan")}
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: "#135d3a",
                shadowColor: "#135d3a",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 8,
              }}
              activeOpacity={0.8}
            >
              <Feather name="maximize" size={22} color="white" />
            </TouchableOpacity>
            <Text
              className="text-[10px] font-semibold mt-1"
              style={{ color: "#135d3a" }}
            >
              Scan
            </Text>
          </View>

          {/* Log Aktivitas */}
          <TouchableOpacity
            className="items-center px-3 py-1"
            onPress={() => router.push("/(guest)/activity-log" as any)}
          >
            <Feather name="activity" size={20} color="#94a3b8" />
            <Text className="text-[10px] font-medium text-slate-400">Log</Text>
          </TouchableOpacity>

          {/* Admin */}
          <TouchableOpacity
            className="items-center px-3 py-1"
            onPress={() => router.push("/(auth)/login")}
          >
            <Feather name="user" size={20} color="#94a3b8" />
            <Text className="text-[10px] font-medium text-slate-400">
              Admin
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
