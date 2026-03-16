import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import type { Asset, Kondisi } from "@shared-types/index";

// ─── Types ───────────────────────────────────────────────────────────────────
type FormState = {
  nomorAset: string;
  namaAset: string;
  kelasAsetSig: string;
  qty: string;
  satuan: string;
  site: string;
  kondisi: Kondisi;
  keterangan: string;
  latitude: string;
  longitude: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const GREEN = "#135d3a";
const LIGHT_GREEN = "#e8f5ee";

const KATEGORI_OPTIONS = [
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Infrastruktur", value: "INFRASTRUKTUR" },
  { label: "Kendaraan & Alat Berat", value: "KENDARAAN & ALAT BERAT" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];

const KONDISI_OPTIONS: Array<{ label: string; value: Kondisi }> = [
  { label: "Baik", value: "BAIK" },
  { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" },
  { label: "Hilang", value: "HILANG" },
  { label: "Belum Dicek", value: "BELUM_DICEK" },
];

const KONDISI_COLOR: Record<Kondisi, string> = {
  BAIK: "#16a34a",
  RUSAK: "#d97706",
  RUSAK_BERAT: "#dc2626",
  HILANG: "#64748b",
  BELUM_DICEK: "#94a3b8",
};

const BLANK_FORM: FormState = {
  nomorAset: "",
  namaAset: "",
  kelasAsetSig: "BANGUNAN",
  qty: "1",
  satuan: "Unit",
  site: "",
  kondisi: "BAIK",
  keterangan: "",
  latitude: "",
  longitude: "",
};

// ─── Column Definitions ──────────────────────────────────────────────────────
const COLUMNS = [
  { key: "no", label: "No", width: 44 },
  { key: "nomorAset", label: "Nomor Aset", width: 140 },
  { key: "namaAset", label: "Nama Aset", width: 200 },
  { key: "kelasAsetSig", label: "Kategori", width: 120 },
  { key: "kondisi", label: "Kondisi", width: 110 },
  { key: "qty", label: "QTY", width: 60 },
  { key: "satuan", label: "Satuan", width: 80 },
  { key: "site", label: "Site", width: 130 },
  { key: "aksi", label: "Aksi", width: 96 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DatabaseScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      loadData(false, 1);
    }, [search])
  );

  async function loadData(isRefresh = false, pageNum = 1) {
    if (isRefresh) {
      setRefreshing(true);
      pageNum = 1;
      setPage(1);
      setHasMore(true);
    } else if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await assetService.getAll({
        search: search || undefined,
        page: pageNum,
        limit: PAGE_SIZE,
      });
      const dedupe = (arr: Asset[]) => {
        const seen = new Set<string>();
        return arr.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
      };
      if (pageNum === 1) {
        setAssets(dedupe(result.data));
      } else {
        setAssets((prev) => dedupe([...prev, ...result.data]));
      }
      setTotal(result.total);
      setPage(pageNum);
      setHasMore(result.data.length >= PAGE_SIZE);
    } catch {
      Alert.alert("Error", "Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore && !loading) loadData(false, page + 1);
  }

  function onSearchChange(text: string) {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadData(false, 1), 400);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingAsset(null);
    setForm(BLANK_FORM);
    setFormErrors({});
    setModalVisible(true);
  }

  function openEdit(asset: Asset) {
    setEditingAsset(asset);
    setForm({
      nomorAset: asset.nomorAset ?? "",
      namaAset: asset.namaAset ?? "",
      kelasAsetSig: asset.kelasAsetSig ?? "BANGUNAN",
      qty: String(asset.qty ?? 1),
      satuan: asset.satuan ?? "Unit",
      site: asset.site ?? "",
      kondisi: asset.kondisi ?? "BAIK",
      keterangan: asset.keterangan ?? "",
      latitude: asset.latitude != null ? String(asset.latitude) : "",
      longitude: asset.longitude != null ? String(asset.longitude) : "",
    });
    setFormErrors({});
    setModalVisible(true);
  }

  function confirmDelete(asset: Asset) {
    Alert.alert(
      "Hapus Aset",
      `Yakin ingin menghapus "${asset.namaAset}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await assetService.remove(asset.id);
              setAssets((prev) => prev.filter((a) => a.id !== asset.id));
              setTotal((t) => t - 1);
            } catch {
              Alert.alert("Error", "Gagal menghapus aset");
            }
          },
        },
      ]
    );
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateForm(): boolean {
    const errors: typeof formErrors = {};
    if (!form.nomorAset.trim()) errors.nomorAset = "Wajib diisi";
    if (!form.namaAset.trim()) errors.namaAset = "Wajib diisi";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) < 1) errors.qty = "Angka positif";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    const payload: Partial<Asset> = {
      nomorAset: form.nomorAset.trim(),
      namaAset: form.namaAset.trim(),
      kelasAsetSig: form.kelasAsetSig,
      qty: Number(form.qty),
      satuan: form.satuan.trim() || "Unit",
      site: form.site.trim() || null,
      kondisi: form.kondisi,
      keterangan: form.keterangan.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    try {
      if (editingAsset) {
        const updated = await assetService.update(editingAsset.id, payload);
        setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        Alert.alert("Berhasil", "Aset berhasil diperbarui");
      } else {
        const created = await assetService.create(payload);
        setAssets((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        Alert.alert("Berhasil", "Aset berhasil ditambahkan");
      }
      setModalVisible(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Gagal menyimpan";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Row render ─────────────────────────────────────────────────────────────
  const renderRow = useCallback(({ item, index }: { item: Asset; index: number }) => {
    const kondisiColor = KONDISI_COLOR[item.kondisi] ?? GREEN;
    const isEven = index % 2 === 0;
    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isEven ? "white" : "#f8fafc",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
          minHeight: 52,
          alignItems: "center",
        }}
      >
        {/* No */}
        <View style={{ width: COLUMNS[0].width, paddingHorizontal: 8, alignItems: "center" }}>
          <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "600" }}>{index + 1}</Text>
        </View>
        {/* Nomor Aset */}
        <View style={{ width: COLUMNS[1].width, paddingHorizontal: 8 }}>
          <Text style={{ color: "#1e293b", fontSize: 12, fontWeight: "600" }} numberOfLines={2}>
            {item.nomorAset}
          </Text>
        </View>
        {/* Nama Aset */}
        <View style={{ width: COLUMNS[2].width, paddingHorizontal: 8 }}>
          <Text style={{ color: "#1e293b", fontSize: 12, fontWeight: "700" }} numberOfLines={2}>
            {item.namaAset}
          </Text>
        </View>
        {/* Kategori */}
        <View style={{ width: COLUMNS[3].width, paddingHorizontal: 8 }}>
          <View
            style={{
              backgroundColor: GREEN + "18",
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 3,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: GREEN, fontSize: 10, fontWeight: "700" }} numberOfLines={1}>
              {item.kelasAsetSig || "–"}
            </Text>
          </View>
        </View>
        {/* Kondisi */}
        <View style={{ width: COLUMNS[4].width, paddingHorizontal: 8 }}>
          <View
            style={{
              backgroundColor: kondisiColor + "18",
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 3,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: kondisiColor, fontSize: 10, fontWeight: "700" }}>
              {item.kondisi === "RUSAK_BERAT"
                ? "Rsk Berat"
                : item.kondisi === "BELUM_DICEK"
                ? "Blm Dicek"
                : item.kondisi.charAt(0) + item.kondisi.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
        {/* QTY */}
        <View style={{ width: COLUMNS[5].width, paddingHorizontal: 8, alignItems: "center" }}>
          <Text style={{ color: "#475569", fontSize: 12, fontWeight: "600" }}>{item.qty}</Text>
        </View>
        {/* Satuan */}
        <View style={{ width: COLUMNS[6].width, paddingHorizontal: 8 }}>
          <Text style={{ color: "#475569", fontSize: 12 }} numberOfLines={1}>
            {item.satuan || "–"}
          </Text>
        </View>
        {/* Site */}
        <View style={{ width: COLUMNS[7].width, paddingHorizontal: 8 }}>
          <Text style={{ color: "#64748b", fontSize: 11 }} numberOfLines={2}>
            {item.site || "–"}
          </Text>
        </View>
        {/* Aksi */}
        <View style={{ width: COLUMNS[8].width, paddingHorizontal: 8, flexDirection: "row", gap: 6 }}>
          <TouchableOpacity
            onPress={() => openEdit(item)}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: LIGHT_GREEN,
              alignItems: "center", justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={14} color={GREEN} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: "#fee2e2",
              alignItems: "center", justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={14} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top", "bottom"]}>
      {/* Header */}
      <View
        style={{
          backgroundColor: GREEN,
          paddingTop: 12,
          paddingBottom: 14,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: GREEN,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Title Row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center", marginRight: 12,
            }}
          >
            <Feather name="arrow-left" size={18} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>Database Aset</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 1 }}>
              {total} total record
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Feather name="database" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>
              CRUD
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 14,
            paddingHorizontal: 14,
          }}
        >
          <Feather name="search" size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 10, color: "white", fontSize: 14 }}
            placeholder="Cari nomor atau nama aset..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={search}
            onChangeText={onSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>Memuat data...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Table Header */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: GREEN,
                paddingVertical: 10,
                paddingHorizontal: 0,
              }}
            >
              {COLUMNS.map((col) => (
                <View key={col.key} style={{ width: col.width, paddingHorizontal: 8 }}>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 11,
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Table Body */}
            <FlatList
              data={assets}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadData(true)}
                  colors={[GREEN]}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 16, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={GREEN} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 64 }}>
                  <View
                    style={{
                      width: 64, height: 64, borderRadius: 20,
                      backgroundColor: LIGHT_GREEN,
                      alignItems: "center", justifyContent: "center", marginBottom: 14,
                    }}
                  >
                    <Feather name="database" size={28} color={GREEN} />
                  </View>
                  <Text style={{ color: "#1e293b", fontWeight: "700", fontSize: 15 }}>
                    Tidak ada data
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                    Tap + untuk menambah aset baru
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={openAdd}
        style={{
          position: "absolute",
          bottom: Platform.OS === "android" ? 20 : 36,
          right: 20,
          width: 56, height: 56, borderRadius: 20,
          backgroundColor: GREEN,
          alignItems: "center", justifyContent: "center",
          shadowColor: GREEN,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: "92%",
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row", alignItems: "center",
                  justifyContent: "space-between",
                  padding: 20, paddingBottom: 14,
                  borderBottomWidth: 1, borderBottomColor: "#f1f5f9",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      backgroundColor: LIGHT_GREEN,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Feather name={editingAsset ? "edit-2" : "plus"} size={16} color={GREEN} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#1e293b" }}>
                    {editingAsset ? "Edit Aset" : "Tambah Aset"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Nomor & Nama */}
                <SectionLabel>Identitas Aset</SectionLabel>
                <FormField
                  label="Nomor Aset"
                  required
                  value={form.nomorAset}
                  onChangeText={(v) => setField("nomorAset", v)}
                  placeholder="Contoh: 141310000238"
                  error={formErrors.nomorAset}
                />
                <FormField
                  label="Nama Aset"
                  required
                  value={form.namaAset}
                  onChangeText={(v) => setField("namaAset", v)}
                  placeholder="Contoh: Pos Satpam Mess"
                  error={formErrors.namaAset}
                  multiline
                />

                {/* Kategori */}
                <Text style={labelStyle}>
                  Kategori <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {KATEGORI_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setField("kelasAsetSig", opt.value)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: form.kelasAsetSig === opt.value ? GREEN : "#f8fafc",
                        borderWidth: 1,
                        borderColor: form.kelasAsetSig === opt.value ? GREEN : "#e2e8f0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12, fontWeight: "600",
                          color: form.kelasAsetSig === opt.value ? "white" : "#475569",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* QTY & Satuan */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Jumlah"
                      required
                      value={form.qty}
                      onChangeText={(v) => setField("qty", v)}
                      placeholder="1"
                      keyboardType="numeric"
                      error={formErrors.qty}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Satuan"
                      value={form.satuan}
                      onChangeText={(v) => setField("satuan", v)}
                      placeholder="Unit"
                    />
                  </View>
                </View>

                {/* Site */}
                <SectionLabel>Lokasi</SectionLabel>
                <FormField
                  label="Site"
                  value={form.site}
                  onChangeText={(v) => setField("site", v)}
                  placeholder="Contoh: Gedung Utama"
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Latitude"
                      value={form.latitude}
                      onChangeText={(v) => setField("latitude", v)}
                      placeholder="-2.9761"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField
                      label="Longitude"
                      value={form.longitude}
                      onChangeText={(v) => setField("longitude", v)}
                      placeholder="104.7754"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Kondisi */}
                <SectionLabel>Kondisi Aset</SectionLabel>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {KONDISI_OPTIONS.map((opt) => {
                    const c = KONDISI_COLOR[opt.value];
                    const isSelected = form.kondisi === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setField("kondisi", opt.value)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
                          backgroundColor: isSelected ? c : "#f8fafc",
                          borderWidth: 1,
                          borderColor: isSelected ? c : "#e2e8f0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12, fontWeight: "600",
                            color: isSelected ? "white" : "#475569",
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Keterangan */}
                <SectionLabel>Keterangan</SectionLabel>
                <FormField
                  label="Catatan"
                  value={form.keterangan}
                  onChangeText={(v) => setField("keterangan", v)}
                  placeholder="Catatan tambahan (opsional)"
                  multiline
                  numberOfLines={3}
                  inputStyle={{ minHeight: 76, textAlignVertical: "top" }}
                />

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Modal Footer */}
              <View
                style={{
                  flexDirection: "row", gap: 10,
                  padding: 16,
                  paddingBottom: Platform.OS === "ios" ? 32 : 16,
                  borderTopWidth: 1, borderTopColor: "#f1f5f9",
                }}
              >
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 14,
                    backgroundColor: "#f1f5f9", alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#64748b", fontWeight: "700", fontSize: 14 }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2, paddingVertical: 14, borderRadius: 14,
                    backgroundColor: GREEN, alignItems: "center",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                      {editingAsset ? "Simpan Perubahan" : "Tambah Aset"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: 13,
  fontWeight: "600" as const,
  color: "#374151",
  marginBottom: 6,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 8,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline,
  numberOfLines,
  inputStyle,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
  numberOfLines?: number;
  inputStyle?: object;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={labelStyle}>
        {label}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          {
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: error ? "#ef4444" : "#e2e8f0",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: "#1e293b",
          },
          inputStyle,
        ]}
      />
      {error ? (
        <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
