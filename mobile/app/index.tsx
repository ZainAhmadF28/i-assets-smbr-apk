import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
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
    bgColor: "#fce8e7",
    textColor: "#d7362d",
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
    bgColor: "#fce8e7",
    textColor: "#d7362d",
    title: "Filter & Cari",
    desc: "Temukan aset berdasarkan nama, kategori, dll",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View
          className="pt-14 pb-8 px-5"
          style={{ backgroundColor: "#135d3a" }}
        >
          <Text className="text-white text-2xl font-bold">I-Asset SMBR</Text>
          <Text
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            PT Semen Baturaja (Persero) Tbk
          </Text>

          {/* Search Bar */}
          <View
            className="bg-white rounded-2xl mt-5 px-4"
            style={{
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari nama atau ID aset..."
              placeholderTextColor="#94a3b8"
              className="flex-1 text-sm text-slate-700 py-3 ml-3"
              returnKeyType="search"
              onSubmitEditing={() => router.push("/(admin)/dashboard")}
            />
            <TouchableOpacity
              onPress={() => router.push("/(admin)/dashboard")}
              className="rounded-xl px-4 py-2"
              style={{ backgroundColor: "#135d3a" }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-xs font-semibold">Cari</Text>
            </TouchableOpacity>
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
                style={{ backgroundColor: "#d7362d" }}
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
            <Text className="text-xl font-black" style={{ color: "#d7362d" }}>
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

        <Text className="text-center text-[10px] text-slate-300 mt-8">
          © 2026 PT Semen Baturaja (Persero) Tbk
        </Text>
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
                backgroundColor: "#d7362d",
                shadowColor: "#d7362d",
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
              style={{ color: "#d7362d" }}
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
