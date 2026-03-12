import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { assetService } from "@services/assetService";
import type { Asset } from "@shared-types/index";
import KondisiBadge from "@components/ui/KondisiBadge";
import MapViewer from "@components/maps/MapViewer";

const { width: SCREEN_W } = Dimensions.get("window");

export default function AdminAssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Set header right button for edit
  useLayoutEffect(() => {
    if (!asset) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(`/(admin)/asset/edit/${asset.id}`)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 4,
          }}
        >
          <Feather name="edit-2" size={14} color="white" />
          <Text style={{ color: "white", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [asset, navigation, router]);

  useEffect(() => {
    if (id) loadAsset(id);
  }, [id]);

  async function loadAsset(assetId: string) {
    try {
      setLoading(true);
      const data = await assetService.getById(assetId);
      setAsset(data);
    } catch {
      Alert.alert("Error", "Aset tidak ditemukan.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePhoto() {
    Alert.alert("Update Foto", "Pilih sumber foto", [
      {
        text: "Kamera",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ["images"] });
          if (!result.canceled && result.assets[0] && id) {
            await uploadPhoto(result.assets[0].uri, id);
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ["images"] });
          if (!result.canceled && result.assets[0] && id) {
            await uploadPhoto(result.assets[0].uri, id);
          }
        },
      },
      { text: "Batal", style: "cancel" },
    ]);
  }

  async function uploadPhoto(uri: string, assetId: string) {
    setUploadingPhoto(true);
    try {
      const updated = await assetService.uploadPhoto(assetId, uri);
      setAsset(updated);
      Alert.alert("Berhasil", "Foto aset berhasil diperbarui");
    } catch {
      Alert.alert("Error", "Gagal mengupload foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Delete Modal Animations ───────────────────────────────────
  function openDeleteModal() {
    setShowDeleteModal(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeDeleteModal() {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDeleteModal(false);
    });
  }

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await assetService.remove(id);
      closeDeleteModal();
      setTimeout(() => {
        Alert.alert("Berhasil", "Aset berhasil dihapus", [
          { text: "OK", onPress: () => router.replace("/(admin)/dashboard") },
        ]);
      }, 300);
    } catch {
      Alert.alert("Error", "Gagal menghapus aset");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#135d3a" />
      </View>
    );
  }

  if (!asset) return null;

  const photoUrl = assetService.getPhotoUrl(asset.fotoUrl);
  const qrUrl = assetService.getQrUrl(asset.id);

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        {/* Foto */}
        <View style={{ backgroundColor: "white" }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: 220, backgroundColor: "#e8f5ee", alignItems: "center", justifyContent: "center" }}>
              <Feather name="image" size={48} color="#135d3a" />
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>Foto belum tersedia</Text>
            </View>
          )}
          <TouchableOpacity
            style={{
              position: "absolute", bottom: 12, right: 12,
              backgroundColor: "#135d3a",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={handleUpdatePhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="camera" size={13} color="white" />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>Update Foto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-4 pb-8">
          {/* Info */}
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <Text className="text-xs text-gray-400 font-mono">{asset.nomorAset}</Text>
            <Text className="text-xl font-bold text-gray-900 mt-0.5 mb-3">{asset.namaAset}</Text>
            <KondisiBadge kondisi={asset.kondisi} />
            <View className="mt-3 pt-3 border-t border-gray-50">
              <InfoRow label="Kelas SIG" value={asset.kelasAsetSig || "-"} />
              <InfoRow label="Site" value={asset.site || "-"} />
              <InfoRow label="Jumlah" value={`${asset.qty} ${asset.satuan || "PC"}`} />
            </View>
          </View>

          {/* Keterangan */}
          {asset.keterangan && (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Catatan/Keterangan</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">{asset.keterangan}</Text>
            </View>
          )}

          {/* Lokasi */}
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 12 }}>Lokasi Aset</Text>
            {asset.site && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Feather name="navigation" size={12} color="#135d3a" />
                <Text style={{ color: "#334155", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                  Site: {asset.site}
                </Text>
              </View>
            )}
            {asset.latitude && asset.longitude && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Feather name="map-pin" size={12} color="#135d3a" />
                <Text style={{ color: "#64748b", fontSize: 11, marginLeft: 6 }}>
                  {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            <MapViewer latitude={asset.latitude} longitude={asset.longitude} namaAset={asset.namaAset} height={220} />
          </View>

          {/* QR Code */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm items-center">
            <Text className="text-sm font-semibold text-gray-700 mb-3">QR Code Aset</Text>
            <Image
              source={{ uri: qrUrl }}
              className="w-48 h-48"
              resizeMode="contain"
            />
            <Text className="text-xs text-gray-400 mt-2 font-mono">{asset.id}</Text>
          </View>

          {/* Hapus Aset Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: deleting ? "#fca5a5" : "#ef4444",
              borderRadius: 16,
              padding: 16,
            }}
            onPress={openDeleteModal}
            disabled={deleting}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15, marginLeft: 8 }}>Hapus Aset</Text>
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-4">
            Terakhir diperbarui:{" "}
            {new Date(asset.updatedAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
          </Text>
        </View>
      </ScrollView>

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="none"
        onRequestClose={closeDeleteModal}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* Backdrop */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: backdropOpacity,
            }}
          />
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={closeDeleteModal}
          />

          {/* Modal Card */}
          <Animated.View
            style={{
              width: SCREEN_W - 56,
              backgroundColor: "white",
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.25,
              shadowRadius: 32,
              elevation: 20,
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            }}
          >
            {/* Warning Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#fef2f2",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Feather name="alert-triangle" size={32} color="#ef4444" />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#1e293b",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Hapus Aset?
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 6,
              }}
            >
              Apakah Anda yakin ingin menghapus aset{" "}
              <Text style={{ fontWeight: "700", color: "#1e293b" }}>
                "{asset?.namaAset}"
              </Text>
              ?
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Tindakan ini tidak dapat dibatalkan dan semua data terkait akan hilang.
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
                onPress={closeDeleteModal}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#475569", fontWeight: "700", fontSize: 14 }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: deleting ? "#fca5a5" : "#ef4444",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={confirmDelete}
                disabled={deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="trash-2" size={14} color="white" />
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14, marginLeft: 6 }}>
                      Ya, Hapus
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-800 text-sm font-medium">{value}</Text>
    </View>
  );
}
