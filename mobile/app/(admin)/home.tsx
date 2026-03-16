import React, {
  useCallback, useEffect, useRef, useState, memo,
} from "react";
import {
  ActivityIndicator, Alert, Animated, FlatList, KeyboardAvoidingView,
  Modal, Platform, RefreshControl, ScrollView, Text, TextInput,
  TouchableOpacity, View, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { authService } from "@services/authService";
import { assetService } from "@services/assetService";
import { API_BASE_URL } from "@config/apiConfig";
import type { Asset, Kondisi, User } from "@shared-types/index";

// ─── Palette ─────────────────────────────────────────────────────────────────
const GREEN = "#135d3a";
const GREEN_LIGHT = "#e8f5ee";

const KONDISI_COLOR: Record<Kondisi, string> = {
  BAIK: "#16a34a", RUSAK: "#d97706", RUSAK_BERAT: "#dc2626",
  HILANG: "#64748b", BELUM_DICEK: "#94a3b8",
};

// ─── Table definitions ───────────────────────────────────────────────────────
type TableKey = "aset" | "user" | "log";

const TABLES: Array<{ key: TableKey; label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
  { key: "aset", label: "Aset", icon: "box" },
  { key: "user", label: "User", icon: "users" },
  { key: "log", label: "Activity Log", icon: "activity" },
];

// ── Aset columns (all fields)
const COLS_ASET = [
  { key: "no", label: "No", w: 44 },
  { key: "id", label: "ID", w: 300 },
  { key: "nomorAset", label: "Nomor Aset", w: 160 },
  { key: "namaAset", label: "Nama Aset", w: 220 },
  { key: "kodeKelas", label: "Kode Kelas", w: 110 },
  { key: "kelasAsetSmbr", label: "Kelas SMBR", w: 160 },
  { key: "kelasAsetSig", label: "Kategori SIG", w: 140 },
  { key: "kondisi", label: "Kondisi", w: 110 },
  { key: "qty", label: "QTY", w: 60 },
  { key: "satuan", label: "Satuan", w: 80 },
  { key: "site", label: "Site", w: 160 },
  { key: "latitude", label: "Latitude", w: 110 },
  { key: "longitude", label: "Longitude", w: 110 },
  { key: "tanggalUpdate", label: "Tgl Update", w: 130 },
  { key: "keterangan", label: "Keterangan", w: 200 },
  { key: "fotoUrl", label: "Foto", w: 80 },
  { key: "qrCode", label: "QR Code", w: 80 },
  { key: "createdAt", label: "Dibuat", w: 160 },
  { key: "updatedAt", label: "Diperbarui", w: 160 },
  { key: "aksi", label: "Aksi", w: 96 },
];

// ── User columns (all fields except password)
const COLS_USER = [
  { key: "no", label: "No", w: 44 },
  { key: "id", label: "ID", w: 300 },
  { key: "name", label: "Nama", w: 160 },
  { key: "email", label: "Email", w: 200 },
  { key: "role", label: "Role", w: 100 },
  { key: "createdAt", label: "Dibuat", w: 160 },
  { key: "updatedAt", label: "Diperbarui", w: 160 },
];

// ── Log columns (all fields)
const COLS_LOG = [
  { key: "no", label: "No", w: 44 },
  { key: "id", label: "ID", w: 300 },
  { key: "action", label: "Aksi", w: 130 },
  { key: "assetName", label: "Nama Aset", w: 200 },
  { key: "assetNomor", label: "Nomor Aset", w: 160 },
  { key: "assetId", label: "Asset ID", w: 300 },
  { key: "details", label: "Detail/Catatan", w: 250 },
  { key: "createdAt", label: "Waktu", w: 160 },
];

// ─── CRUD form ────────────────────────────────────────────────────────────────
type FormState = {
  nomorAset: string; namaAset: string; kelasAsetSig: string;
  qty: string; satuan: string; site: string; kondisi: Kondisi;
  keterangan: string; latitude: string; longitude: string;
};
const BLANK_FORM: FormState = {
  nomorAset: "", namaAset: "", kelasAsetSig: "BANGUNAN",
  qty: "1", satuan: "Unit", site: "", kondisi: "BAIK",
  keterangan: "", latitude: "", longitude: "",
};
const KATEGORI_OPTIONS = [
  { label: "Bangunan", value: "BANGUNAN" },
  { label: "Infrastruktur", value: "INFRASTRUKTUR" },
  { label: "Kendaraan & Alat Berat", value: "KENDARAAN & ALAT BERAT" },
  { label: "Perlengkapan", value: "PERLENGKAPAN" },
  { label: "Tanah", value: "TANAH" },
];
const KONDISI_OPTIONS: Array<{ label: string; value: Kondisi }> = [
  { label: "Baik", value: "BAIK" }, { label: "Rusak", value: "RUSAK" },
  { label: "Rusak Berat", value: "RUSAK_BERAT" }, { label: "Hilang", value: "HILANG" },
  { label: "Belum Dicek", value: "BELUM_DICEK" },
];
const ROW_H = 64;

function fmtDate(s: string | null | undefined): string {
  if (!s) return "–";
  try { return new Date(s).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }); }
  catch { return s; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminHomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sidebarAnim = useRef(new Animated.Value(-280)).current;

  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTable, setActiveTable] = useState<TableKey>("aset");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewQrValue, setPreviewQrValue] = useState<string | null>(null);

  // data states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 50;

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authService.getStoredUser().then(setUser);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { loadData(false, 1); }, [activeTable, search]));

  function openSidebar() {
    setSidebarOpen(true);
    Animated.timing(sidebarAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  }
  function closeSidebar() {
    Animated.timing(sidebarAnim, { toValue: -280, duration: 220, useNativeDriver: true }).start(() => setSidebarOpen(false));
  }
  function selectTable(t: TableKey) {
    setActiveTable(t);
    setSearch("");
    setPage(1);
    closeSidebar();
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  async function loadData(isRefresh = false, pageNum = 1) {
    if (isRefresh) { setRefreshing(true); pageNum = 1; setPage(1); setHasMore(true); }
    else if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      if (activeTable === "aset") {
        const result = await assetService.getAll({ search: search || undefined, page: pageNum, limit: PAGE_SIZE });
        const dedup = (arr: Asset[]) => { const s = new Set<string>(); return arr.filter(a => { if (s.has(a.id)) return false; s.add(a.id); return true; }); };
        if (pageNum === 1) setAssets(dedup(result.data));
        else setAssets(prev => dedup([...prev, ...result.data]));
        setTotal(result.total);
        setHasMore(result.data.length >= PAGE_SIZE);
      } else if (activeTable === "user") {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        setUsers(json.data ?? []);
        setTotal(json.total ?? 0);
        setHasMore(false);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/activity-logs?page=${pageNum}&limit=${PAGE_SIZE}`);
        const json = await res.json();
        const data = json.data ?? [];
        if (pageNum === 1) setLogs(data);
        else setLogs(prev => [...prev, ...data]);
        setTotal(json.total ?? 0);
        setHasMore(data.length >= PAGE_SIZE);
      }
      setPage(pageNum);
    } catch { Alert.alert("Error", "Gagal memuat data"); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }

  async function getToken(): Promise<string | null> {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return AsyncStorage.getItem("auth_token");
  }

  function onSearchChange(text: string) {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadData(false, 1), 400);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openAdd() { setEditingAsset(null); setForm(BLANK_FORM); setFormErrors({}); setModalVisible(true); }

  const openEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setForm({
      nomorAset: asset.nomorAset ?? "", namaAset: asset.namaAset ?? "",
      kelasAsetSig: asset.kelasAsetSig ?? "BANGUNAN", qty: String(asset.qty ?? 1),
      satuan: asset.satuan ?? "Unit", site: asset.site ?? "", kondisi: asset.kondisi ?? "BAIK",
      keterangan: asset.keterangan ?? "",
      latitude: asset.latitude != null ? String(asset.latitude) : "",
      longitude: asset.longitude != null ? String(asset.longitude) : "",
    });
    setFormErrors({}); setModalVisible(true);
  }, []);

  const confirmDelete = useCallback((asset: Asset) => {
    Alert.alert("Hapus Aset", `Yakin hapus "${asset.namaAset}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          try { await assetService.remove(asset.id); setAssets(p => p.filter(a => a.id !== asset.id)); setTotal(t => t - 1); }
          catch { Alert.alert("Error", "Gagal menghapus aset"); }
        }
      },
    ]);
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(p => ({ ...p, [key]: value }));
    setFormErrors(p => ({ ...p, [key]: undefined }));
  }
  function validateForm(): boolean {
    const e: typeof formErrors = {};
    if (!form.nomorAset.trim()) e.nomorAset = "Wajib diisi";
    if (!form.namaAset.trim()) e.namaAset = "Wajib diisi";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) < 1) e.qty = "Angka positif";
    setFormErrors(e); return Object.keys(e).length === 0;
  }
  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    const payload: Partial<Asset> = {
      nomorAset: form.nomorAset.trim(), namaAset: form.namaAset.trim(),
      kelasAsetSig: form.kelasAsetSig, qty: Number(form.qty),
      satuan: form.satuan.trim() || "Unit", site: form.site.trim() || null,
      kondisi: form.kondisi, keterangan: form.keterangan.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    try {
      if (editingAsset) {
        const updated = await assetService.update(editingAsset.id, payload);
        setAssets(p => p.map(a => a.id === updated.id ? updated : a));
        Alert.alert("Berhasil", "Aset diperbarui");
      } else {
        const created = await assetService.create(payload);
        setAssets(p => [created, ...p]); setTotal(t => t + 1);
        Alert.alert("Berhasil", "Aset ditambahkan");
      }
      setModalVisible(false);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message ?? "Gagal menyimpan";
      Alert.alert("Error", msg);
    } finally { setSaving(false); }
  }
  async function handleLogout() {
    Alert.alert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await authService.logout(); router.replace("/"); } },
    ]);
  }

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderAsetRow = useCallback(({ item, index }: { item: Asset; index: number }) => (
    <MemoAsetRow item={item} index={index} onEdit={openEdit} onDelete={confirmDelete} onPreviewImage={setPreviewImageUrl} onPreviewQr={setPreviewQrValue} />
  ), [openEdit, confirmDelete]);

  const renderUserRow = useCallback(({ item, index }: { item: any; index: number }) => (
    <MemoUserRow item={item} index={index} />
  ), []);

  const renderLogRow = useCallback(({ item, index }: { item: any; index: number }) => (
    <MemoLogRow item={item} index={index} />
  ), []);

  const currentData = activeTable === "aset" ? assets : activeTable === "user" ? users : logs;
  const currentCols = activeTable === "aset" ? COLS_ASET : activeTable === "user" ? COLS_USER : COLS_LOG;
  const currentRenderer = activeTable === "aset" ? renderAsetRow : activeTable === "user" ? renderUserRow : renderLogRow;
  const activeTableLabel = TABLES.find(t => t.key === activeTable)?.label ?? "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top", "bottom"]}>
      {/* ── Hero Header ── */}
      <View style={{ backgroundColor: GREEN, paddingTop: 8, paddingBottom: 18, paddingHorizontal: 18, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Hamburger */}
            <TouchableOpacity onPress={openSidebar} style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="menu" size={18} color="white" />
            </TouchableOpacity>
            <View style={{ alignItems: "flex-start", justifyContent: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600", marginBottom: 2 }}>Admin Panel · {activeTableLabel}</Text>
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 140, height: 26, tintColor: "white", alignSelf: "flex-start", marginLeft: -35 }}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={() => router.push("/(admin)/scan" as any)} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="maximize" size={15} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="log-out" size={15} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info row + search */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="database" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              <Text style={{ color: "white", fontWeight: "800" }}>{total.toLocaleString("id-ID")}</Text> record
            </Text>
          </View>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 12 }}>
            <Feather name="search" size={13} color="rgba(255,255,255,0.55)" />
            <TextInput
              style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 8, color: "white", fontSize: 13 }}
              placeholder="Cari..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={search}
              onChangeText={onSearchChange}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange("")}>
                <Feather name="x" size={13} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Table ── */}
      <View style={{ flex: 1, marginHorizontal: 14, marginTop: 14, backgroundColor: "white", shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>Memuat data...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
            <View>
              {/* Header row */}
              <View style={{ flexDirection: "row", backgroundColor: GREEN, paddingVertical: 10 }}>
                {currentCols.map(col => (
                  <View key={col.key} style={{ width: col.w, paddingHorizontal: 8 }}>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{col.label}</Text>
                  </View>
                ))}
              </View>
              {/* Body */}
              <FlatList
                data={currentData}
                keyExtractor={item => item.id}
                renderItem={currentRenderer as any}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews={Platform.OS === "android"}
                getItemLayout={(_d, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[GREEN]} />}
                onEndReached={() => { if (!loadingMore && hasMore && !loading) loadData(false, page + 1); }}
                onEndReachedThreshold={0.4}
                ListFooterComponent={loadingMore ? <View style={{ paddingVertical: 16, alignItems: "center" }}><ActivityIndicator size="small" color={GREEN} /></View> : null}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 60 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: GREEN_LIGHT, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <Feather name="database" size={24} color={GREEN} />
                    </View>
                    <Text style={{ color: "#1e293b", fontWeight: "700", fontSize: 14 }}>Tidak ada data</Text>
                  </View>
                }
                contentContainerStyle={{ paddingBottom: 120 }}
              />
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── FAB (aset only) ── */}
      {activeTable === "aset" && (
        <View style={{ position: "absolute", bottom: Platform.OS === "android" ? 20 : 36, right: 20, flexDirection: "row", gap: 12, alignItems: "flex-end" }}>
          <TouchableOpacity onPress={() => router.push("/(admin)/scan" as any)} style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center", shadowColor: "#1e293b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
            <Feather name="camera" size={19} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openAdd} style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }} activeOpacity={0.85}>
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeSidebar}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
      )}
      <Animated.View style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 260, backgroundColor: "white", transform: [{ translateX: sidebarAnim }], shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 16 }}>
        {/* Sidebar header */}
        <View style={{ backgroundColor: GREEN, paddingTop: Platform.OS === "ios" ? 54 : 36, paddingBottom: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>Pilih Tabel</Text>
            <TouchableOpacity onPress={closeSidebar} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="x" size={15} color="white" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="shield" size={15} color="white" />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Admin · {user?.name ?? ""}</Text>
          </View>
        </View>

        {/* Table list */}
        <View style={{ padding: 16, gap: 8 }}>
          {TABLES.map(t => {
            const isActive = t.key === activeTable;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => selectTable(t.key)}
                activeOpacity={0.75}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: isActive ? GREEN_LIGHT : "#f8fafc", borderWidth: 1, borderColor: isActive ? GREEN + "40" : "#f1f5f9" }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isActive ? GREEN : "#e2e8f0", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={t.icon} size={16} color={isActive ? "white" : "#94a3b8"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? GREEN : "#1e293b" }}>{t.label}</Text>
                  <Text style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                    {t.key === "aset" ? "CRUD + semua kolom" : t.key === "user" ? "Read-only" : "Read-only"}
                  </Text>
                </View>
                {isActive && <Feather name="check" size={14} color={GREEN} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sidebar footer */}
        <View style={{ marginTop: "auto", padding: 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, backgroundColor: "#fee2e2" }}
          >
            <Feather name="log-out" size={16} color="#dc2626" />
            <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 13 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Add/Edit CRUD modal (aset only) ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: GREEN_LIGHT, alignItems: "center", justifyContent: "center" }}>
                    <Feather name={editingAsset ? "edit-2" : "plus"} size={16} color={GREEN} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#1e293b" }}>{editingAsset ? "Edit Aset" : "Tambah Aset"}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="x" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FormField label="Nomor Aset" required value={form.nomorAset} onChangeText={v => setField("nomorAset", v)} placeholder="Contoh: 141310000238" error={formErrors.nomorAset} />
                <FormField label="Nama Aset" required value={form.namaAset} onChangeText={v => setField("namaAset", v)} placeholder="Contoh: Pos Satpam" error={formErrors.namaAset} multiline />
                <Text style={labelStyle}>Kategori <Text style={{ color: "#ef4444" }}>*</Text></Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {KATEGORI_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.value} onPress={() => setField("kelasAsetSig", opt.value)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: form.kelasAsetSig === opt.value ? GREEN : "#f8fafc", borderWidth: 1, borderColor: form.kelasAsetSig === opt.value ? GREEN : "#e2e8f0" }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: form.kelasAsetSig === opt.value ? "white" : "#475569" }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}><FormField label="Jumlah" required value={form.qty} onChangeText={v => setField("qty", v)} placeholder="1" keyboardType="numeric" error={formErrors.qty} /></View>
                  <View style={{ flex: 1 }}><FormField label="Satuan" value={form.satuan} onChangeText={v => setField("satuan", v)} placeholder="Unit" /></View>
                </View>
                <FormField label="Site" value={form.site} onChangeText={v => setField("site", v)} placeholder="Gedung Utama" />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}><FormField label="Latitude" value={form.latitude} onChangeText={v => setField("latitude", v)} placeholder="-2.9761" keyboardType="decimal-pad" /></View>
                  <View style={{ flex: 1 }}><FormField label="Longitude" value={form.longitude} onChangeText={v => setField("longitude", v)} placeholder="104.7754" keyboardType="decimal-pad" /></View>
                </View>
                <Text style={labelStyle}>Kondisi</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {KONDISI_OPTIONS.map(opt => {
                    const c = KONDISI_COLOR[opt.value]; const sel = form.kondisi === opt.value;
                    return (
                      <TouchableOpacity key={opt.value} onPress={() => setField("kondisi", opt.value)} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: sel ? c : "#f8fafc", borderWidth: 1, borderColor: sel ? c : "#e2e8f0" }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: sel ? "white" : "#475569" }}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <FormField label="Keterangan" value={form.keterangan} onChangeText={v => setField("keterangan", v)} placeholder="Catatan (opsional)" multiline numberOfLines={3} inputStyle={{ minHeight: 72, textAlignVertical: "top" }} />
                <View style={{ height: 16 }} />
              </ScrollView>
              <View style={{ flexDirection: "row", gap: 10, padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#f1f5f9", alignItems: "center" }}>
                  <Text style={{ color: "#64748b", fontWeight: "700", fontSize: 14 }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: GREEN, alignItems: "center", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>{editingAsset ? "Simpan Perubahan" : "Tambah Aset"}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Image Viewer Modal ── */}
      <Modal visible={!!previewImageUrl || !!previewQrValue} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={{ width: "95%", height: "70%", borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
          {previewQrValue && (
            <View style={{ padding: 24, backgroundColor: "white", borderRadius: 16 }}>
              <QRCode value={previewQrValue} size={250} />
            </View>
          )}
          <TouchableOpacity
            style={{ position: "absolute", top: Platform.OS === "ios" ? 60 : 40, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
            onPress={() => { setPreviewImageUrl(null); setPreviewQrValue(null); }}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const labelStyle = { fontSize: 13, fontWeight: "600" as const, color: "#374151", marginBottom: 6 };

function Cell({ w, center, children }: { w: number; center?: boolean; children: React.ReactNode }) {
  return <View style={{ width: w, paddingHorizontal: 8, alignItems: center ? "center" : "flex-start", justifyContent: "center" }}>{children}</View>;
}
function BadgeText({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "18", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 9, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
function PlainText({ children, color = "#1e293b", size = 11 }: { children: React.ReactNode; color?: string; size?: number }) {
  return <Text style={{ color, fontSize: size, fontWeight: "500" }} numberOfLines={1}>{children}</Text>;
}

// ─── Memoized rows ────────────────────────────────────────────────────────────
const ROW_HEIGHT = ROW_H;

const MemoAsetRow = memo(function AsetRow({ item, index, onEdit, onDelete, onPreviewImage, onPreviewQr }: { item: Asset; index: number; onEdit: (a: Asset) => void; onDelete: (a: Asset) => void; onPreviewImage: (url: string) => void; onPreviewQr: (val: string) => void }) {
  const c = KONDISI_COLOR[item.kondisi] ?? GREEN;
  const isEven = index % 2 === 0;
  const bg = isEven ? "white" : "#f8fafc";
  return (
    <View style={{ flexDirection: "row", backgroundColor: bg, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", height: ROW_HEIGHT, alignItems: "center" }}>
      <Cell w={COLS_ASET[0].w} center><PlainText color="#94a3b8">{index + 1}</PlainText></Cell>
      <Cell w={COLS_ASET[1].w}><PlainText color="#cbd5e1" size={10}>{item.id}</PlainText></Cell>
      <Cell w={COLS_ASET[2].w}><PlainText color="#1e293b" size={12}>{item.nomorAset}</PlainText></Cell>
      <Cell w={COLS_ASET[3].w}><PlainText color="#1e293b" size={12}>{item.namaAset}</PlainText></Cell>
      <Cell w={COLS_ASET[4].w}><PlainText color="#64748b">{item.kodeKelas || "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[5].w}><PlainText color="#64748b">{item.kelasAsetSmbr || "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[6].w}>{item.kelasAsetSig ? <BadgeText label={item.kelasAsetSig} color={GREEN} /> : <PlainText color="#94a3b8">–</PlainText>}</Cell>
      <Cell w={COLS_ASET[7].w}><BadgeText label={item.kondisi === "RUSAK_BERAT" ? "Rsk Berat" : item.kondisi === "BELUM_DICEK" ? "Blm Dicek" : item.kondisi.charAt(0) + item.kondisi.slice(1).toLowerCase()} color={c} /></Cell>
      <Cell w={COLS_ASET[8].w} center><PlainText>{item.qty}</PlainText></Cell>
      <Cell w={COLS_ASET[9].w}><PlainText color="#64748b">{item.satuan || "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[10].w}><PlainText color="#64748b">{item.site || "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[11].w}><PlainText color="#64748b">{item.latitude != null ? String(item.latitude) : "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[12].w}><PlainText color="#64748b">{item.longitude != null ? String(item.longitude) : "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[13].w}><PlainText color="#64748b">{fmtDate(item.tanggalUpdate)}</PlainText></Cell>
      <Cell w={COLS_ASET[14].w}><PlainText color="#64748b">{item.keterangan || "–"}</PlainText></Cell>
      <Cell w={COLS_ASET[15].w}>
        {item.fotoUrl ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onPreviewImage(item.fotoUrl!.startsWith("http") ? item.fotoUrl! : `${API_BASE_URL}${item.fotoUrl!.startsWith("/") ? "" : "/"}${item.fotoUrl}`)}
          >
            <Image
              source={{ uri: item.fotoUrl.startsWith("http") ? item.fotoUrl : `${API_BASE_URL}${item.fotoUrl.startsWith("/") ? "" : "/"}${item.fotoUrl}` }}
              style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: "#f1f5f9" }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <PlainText color="#94a3b8">–</PlainText>
        )}
      </Cell>
      <Cell w={COLS_ASET[16].w}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPreviewQr(item.nomorAset)}
          style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: "white", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" }}
        >
          <QRCode value={item.nomorAset} size={42} />
        </TouchableOpacity>
      </Cell>
      <Cell w={COLS_ASET[17].w}><PlainText color="#94a3b8">{fmtDate(item.createdAt)}</PlainText></Cell>
      <Cell w={COLS_ASET[18].w}><PlainText color="#94a3b8">{fmtDate(item.updatedAt)}</PlainText></Cell>
      <Cell w={COLS_ASET[19].w}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity onPress={() => onEdit(item)} style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: GREEN_LIGHT, alignItems: "center", justifyContent: "center" }} activeOpacity={0.7}><Feather name="edit-2" size={13} color={GREEN} /></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" }} activeOpacity={0.7}><Feather name="trash-2" size={13} color="#dc2626" /></TouchableOpacity>
        </View>
      </Cell>
    </View>
  );
});

const MemoUserRow = memo(function UserRow({ item, index }: { item: any; index: number }) {
  const isEven = index % 2 === 0;
  return (
    <View style={{ flexDirection: "row", backgroundColor: isEven ? "white" : "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", height: ROW_HEIGHT, alignItems: "center" }}>
      <Cell w={COLS_USER[0].w} center><PlainText color="#94a3b8">{index + 1}</PlainText></Cell>
      <Cell w={COLS_USER[1].w}><PlainText color="#cbd5e1" size={10}>{item.id}</PlainText></Cell>
      <Cell w={COLS_USER[2].w}><PlainText color="#1e293b" size={12}>{item.name}</PlainText></Cell>
      <Cell w={COLS_USER[3].w}><PlainText color="#475569">{item.email}</PlainText></Cell>
      <Cell w={COLS_USER[4].w}><BadgeText label={item.role} color={GREEN} /></Cell>
      <Cell w={COLS_USER[5].w}><PlainText color="#94a3b8">{fmtDate(item.createdAt)}</PlainText></Cell>
      <Cell w={COLS_USER[6].w}><PlainText color="#94a3b8">{fmtDate(item.updatedAt)}</PlainText></Cell>
    </View>
  );
});

const MemoLogRow = memo(function LogRow({ item, index }: { item: any; index: number }) {
  const isEven = index % 2 === 0;
  const actionColor = item.action === "CREATED" ? "#16a34a" : item.action === "UPDATED" ? "#d97706" : item.action === "DELETED" ? "#dc2626" : "#0ea5e9";
  return (
    <View style={{ flexDirection: "row", backgroundColor: isEven ? "white" : "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", height: ROW_HEIGHT, alignItems: "center" }}>
      <Cell w={COLS_LOG[0].w} center><PlainText color="#94a3b8">{index + 1}</PlainText></Cell>
      <Cell w={COLS_LOG[1].w}><PlainText color="#cbd5e1" size={10}>{item.id}</PlainText></Cell>
      <Cell w={COLS_LOG[2].w}><BadgeText label={item.action} color={actionColor} /></Cell>
      <Cell w={COLS_LOG[3].w}><PlainText color="#1e293b" size={12}>{item.assetName || "–"}</PlainText></Cell>
      <Cell w={COLS_LOG[4].w}><PlainText color="#475569">{item.assetNomor || "–"}</PlainText></Cell>
      <Cell w={COLS_LOG[5].w}><PlainText color="#cbd5e1" size={10}>{item.assetId || "–"}</PlainText></Cell>
      <Cell w={COLS_LOG[6].w}><PlainText color="#64748b">{item.details || "–"}</PlainText></Cell>
      <Cell w={COLS_LOG[7].w}><PlainText color="#94a3b8">{fmtDate(item.createdAt)}</PlainText></Cell>
    </View>
  );
});

function FormField({ label, required, value, onChangeText, placeholder, error, keyboardType, multiline, numberOfLines, inputStyle }: {
  label: string; required?: boolean; value: string; onChangeText: (v: string) => void;
  placeholder?: string; error?: string; keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean; numberOfLines?: number; inputStyle?: object;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={labelStyle}>{label}{required && <Text style={{ color: "#ef4444" }}> *</Text>}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#cbd5e1" keyboardType={keyboardType ?? "default"}
        multiline={multiline} numberOfLines={numberOfLines}
        style={[{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: error ? "#ef4444" : "#e2e8f0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1e293b" }, inputStyle]}
      />
      {error ? <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
