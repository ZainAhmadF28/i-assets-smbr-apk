import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";

type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

const features: {
  icon: FeatherIcon;
  bgColor: string;
  textColor: string;
  title: string;
  desc: string;
}[] = [
  {
    icon: "camera",
    bgColor: "#e8f5ee",
    textColor: "#135d3a",
    title: "Scan QR Code",
    desc: "Identifikasi aset fisik langsung via kamera HP",
  },
  {
    icon: "map-pin",
    bgColor: "#e8f5ee",
    textColor: "#135d3a",
    title: "Tracking Lokasi",
    desc: "Lihat posisi aset di peta secara visual",
  },
  {
    icon: "clipboard",
    bgColor: "#e8f5ee",
    textColor: "#135d3a",
    title: "Katalog Digital",
    desc: "Kelola data aset lengkap dalam satu platform",
  },
  {
    icon: "filter",
    bgColor: "#e8f5ee",
    textColor: "#135d3a",
    title: "Filter & Cari",
    desc: "Temukan aset berdasarkan nama, kategori, dll",
  },
];

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

        {/* Features */}
        <View className="px-4 mt-5">
          <Text
            className="text-[11px] font-semibold text-slate-400 uppercase mb-3 px-1"
            style={{ letterSpacing: 2 }}
          >
            Fitur Utama
          </Text>

          {/* Row 1 */}
          <View style={{ flexDirection: "row" }}>
            {features.slice(0, 2).map((f, i) => (
              <View
                key={f.title}
                className="flex-1 bg-white rounded-2xl p-4"
                style={{
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  marginRight: i === 0 ? 6 : 0,
                  marginLeft: i === 1 ? 6 : 0,
                }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: f.bgColor }}
                >
                  <Feather name={f.icon} size={18} color={f.textColor} />
                </View>
                <Text className="font-semibold text-slate-700 text-[13px]">
                  {f.title}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-1">
                  {f.desc}
                </Text>
              </View>
            ))}
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            {features.slice(2, 4).map((f, i) => (
              <View
                key={f.title}
                className="flex-1 bg-white rounded-2xl p-4"
                style={{
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  marginRight: i === 0 ? 6 : 0,
                  marginLeft: i === 1 ? 6 : 0,
                }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: f.bgColor }}
                >
                  <Feather name={f.icon} size={18} color={f.textColor} />
                </View>
                <Text className="font-semibold text-slate-700 text-[13px]">
                  {f.title}
                </Text>
                <Text className="text-[11px] text-slate-400 mt-1">
                  {f.desc}
                </Text>
              </View>
            ))}
          </View>
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
