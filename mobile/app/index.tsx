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
  kategori: string;
  kondisi: string;
  gambar: string | null;
  updatedAt: string;
};

const KATEGORI_COLOR: Record<string, string> = {
  BANGUNAN: "#0ea5e9",
  KENDARAAN_DINAS: "#f59e0b",
  PERLENGKAPAN: "#8b5cf6",
  TANAH: "#10b981",
};

const KONDISI_COLOR: Record<string, string> = {
  BAIK: "#135d3a",
  RUSAK: "#f59e0b",
  RUSAK_BERAT: "#ef4444",
};

const KONDISI_LABEL: Record<string, string> = {
  BAIK: "Baik",
  RUSAK: "Rusak",
  RUSAK_BERAT: "Rusak Berat",
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

type StockData = {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
} | null;

export default function HomePage() {
  const router = useRouter();
  const [stock, setStock] = useState<StockData>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [recentAssets, setRecentAssets] = useState<AssetUpdate[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderRef = useRef<FlatList<AssetUpdate>>(null);

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

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch(
        "https://query1.finance.yahoo.com/v8/finance/chart/SMBR.JK?interval=1d&range=1d",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const price = meta.regularMarketPrice ?? 0;
        const prev = meta.previousClose ?? price;
        const change = price - prev;
        const changePct = prev !== 0 ? (change / prev) * 100 : 0;
        setStock({
          price,
          change,
          changePct,
          high: meta.regularMarketDayHigh ?? 0,
          low: meta.regularMarketDayLow ?? 0,
          volume: meta.regularMarketVolume ?? 0,
        });
      }
    } catch (_) {
      // silent fail — keep showing last data
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 30000);
    return () => clearInterval(interval);
  }, [fetchStock]);

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
          {/* Dark overlay */}
          <View
            className="pt-14 px-5"
            style={{ paddingBottom: 20 }}
          >
            <View style={{ height: 10 }} />
          </View>
        </ImageBackground>

        {/* White rounded content area — GoPay style */}
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -30,
            paddingTop: 20,
          }}
        >

        {/* SMBR Stock Ticker */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              borderRadius: 20,
              backgroundColor: "rgba(19, 93, 58, 0.75)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
              padding: 14,
              shadowColor: "#135d3a",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
              {/* Header row */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.25)",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 12 }}>SMBR</Text>
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                  PT Semen Baturaja · IDX
                </Text>
                <View style={{ flex: 1 }} />
                {stockLoading ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
                ) : (
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Live ●</Text>
                )}
              </View>

              {/* Price row */}
              {stock ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 10 }}>
                    <Text style={{ color: "white", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
                      Rp{stock.price.toLocaleString("id-ID")}
                    </Text>
                    <View
                      style={{
                        marginLeft: 10,
                        marginBottom: 4,
                        backgroundColor: stock.change >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{
                        color: stock.change >= 0 ? "#6ee7b7" : "#fca5a5",
                        fontSize: 12,
                        fontWeight: "700",
                      }}>
                        {stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.changePct).toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  {/* H/L/Vol row */}
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>High</Text>
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" }}>
                        {stock.high.toLocaleString("id-ID")}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Low</Text>
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" }}>
                        {stock.low.toLocaleString("id-ID")}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Volume</Text>
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "600" }}>
                        {(stock.volume / 1000).toFixed(0)}K
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Memuat data saham...</Text>
              )}
          </TouchableOpacity>
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
              onPress={() => router.push("/(guest)/scan")}
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

        {/* Stats */}
        <View className="px-4 mt-5" style={{ flexDirection: "row" }}>
          <View
            className="flex-1 bg-white rounded-2xl p-4 items-center mr-1.5"
            style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
          >
            <Text className="text-xl font-black" style={{ color: "#135d3a" }}>
              —
            </Text>
            <Text className="text-[10px] text-slate-400 mt-1">Total Aset</Text>
          </View>
          <View
            className="flex-1 bg-white rounded-2xl p-4 items-center mx-1.5"
            style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
          >
            <Text className="text-xl font-black" style={{ color: "#135d3a" }}>
              4
            </Text>
            <Text className="text-[10px] text-slate-400 mt-1">Kategori</Text>
          </View>
          <View
            className="flex-1 bg-white rounded-2xl p-4 items-center ml-1.5"
            style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
          >
            <Text className="text-xl font-black" style={{ color: "#135d3a" }}>
              —
            </Text>
            <Text className="text-[10px] text-slate-400 mt-1">Lokasi</Text>
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
                    {item.gambar ? (
                      <Image
                        source={{ uri: `${API_BASE_URL}${item.gambar}` }}
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
                            backgroundColor: (KATEGORI_COLOR[item.kategori] ?? "#135d3a") + "22",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginRight: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: KATEGORI_COLOR[item.kategori] ?? "#135d3a",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {item.kategori.replace("_", " ")}
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
              onPress={() => router.push("/(guest)/scan")}
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

          {/* Cari */}
          <TouchableOpacity
            className="items-center px-3 py-1"
            onPress={() => router.push("/(admin)/dashboard")}
          >
            <Feather name="search" size={20} color="#94a3b8" />
            <Text className="text-[10px] font-medium text-slate-400">Cari</Text>
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
