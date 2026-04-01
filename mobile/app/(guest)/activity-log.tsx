import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { API_BASE_URL } from "../../config/apiConfig";
import { useNotification } from "../../context/NotificationContext";

type ActivityLog = {
  id: string;
  action: string;
  assetId: string | null;
  assetName: string;
  assetNomor: string;
  details: string | null;
  createdAt: string;
};

type ActionConfig = { icon: keyof typeof Feather.glyphMap; color: string; bg: string; label: string };

const DEFAULT_CONFIG: ActionConfig = { icon: "activity", color: "#64748b", bg: "#f1f5f9", label: "Diperbarui" };

function getActionConfig(action: string): ActionConfig {
  const key = action?.toLowerCase() ?? "";
  if (key === "created" || key.includes("tambah") || key.includes("ditambahkan"))
    return { icon: "plus-circle", color: "#10b981", bg: "#d1fae5", label: "Ditambahkan" };
  if (key === "deleted" || key.includes("hapus"))
    return { icon: "trash-2", color: "#ef4444", bg: "#fee2e2", label: "Dihapus" };
  if (key === "photo_uploaded" || key.includes("foto") || key.includes("photo"))
    return { icon: "camera", color: "#8b5cf6", bg: "#ede9fe", label: "Foto Diupload" };
  // Format gabungan: "Edit: Nama, Kondisi, ..."
  if (key.startsWith("edit:"))
    return { icon: "edit-3", color: "#3b82f6", bg: "#dbeafe", label: "Data Diubah" };
  if (key.includes("nama"))
    return { icon: "type", color: "#f59e0b", bg: "#fef3c7", label: "Nama Diubah" };
  if (key.includes("nomor"))
    return { icon: "hash", color: "#f59e0b", bg: "#fef3c7", label: "Nomor Diubah" };
  if (key.includes("kondisi"))
    return { icon: "shield", color: "#3b82f6", bg: "#dbeafe", label: "Kondisi Diubah" };
  if (key.includes("lokasi") || key.includes("site") || key.includes("koordinat") || key.includes("latitude") || key.includes("longitude"))
    return { icon: "map-pin", color: "#14b8a6", bg: "#ccfbf1", label: "Lokasi Diubah" };
  if (key === "updated" || key.includes("perbarui") || key.includes("pembaruan") || key.includes("update"))
    return { icon: "edit-3", color: "#3b82f6", bg: "#dbeafe", label: "Diperbarui" };
  return DEFAULT_CONFIG;
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ActivityLogScreen() {
  const router = useRouter();
  const { markAsSeen } = useNotification();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/activity-logs?page=${pageNum}&limit=20`
        );
        const json = await res.json();
        if (json?.data) {
          setLogs((prev) => (reset ? json.data : [...prev, ...json.data]));
          setHasMore(json.data.length === 20);
        }
      } catch (_) {
        // silent fail
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    markAsSeen();
    fetchLogs(1, true);
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchLogs(1, true);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage);
  };

  // Group logs by date
  const groupByDate = (items: ActivityLog[]) => {
    const groups: { title: string; data: ActivityLog[] }[] = [];
    let currentDate = "";
    for (const item of items) {
      const date = formatDate(item.createdAt);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ title: date, data: [item] });
      } else {
        groups[groups.length - 1].data.push(item);
      }
    }
    return groups;
  };

  const groups = groupByDate(logs);

  const renderItem = ({ item }: { item: ActivityLog }) => {
    const config = getActionConfig(item.action);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (item.assetId) {
            router.push(`/(admin)/asset/${item.assetId}` as any);
          }
        }}
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        {/* Timeline dot + line */}
        <View style={{ alignItems: "center", width: 40, marginRight: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: config.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={config.icon} size={16} color={config.color} />
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <View
              style={{
                backgroundColor: config.bg,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: config.color,
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {config.label}
              </Text>
            </View>
            <Text style={{ color: "#94a3b8", fontSize: 10 }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text
            style={{
              color: "#1e293b",
              fontWeight: "600",
              fontSize: 14,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {item.assetName}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 11 }} numberOfLines={1}>
            #{item.assetNomor}
            {item.details ? ` · ${item.details}` : ""}
          </Text>
        </View>

        {/* Chevron */}
        {item.assetId && (
          <View style={{ justifyContent: "center" }}>
            <Feather name="chevron-right" size={14} color="#cbd5e1" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#135d3a" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Platform.OS === "android" ? 24 : 44,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#135d3a"
            colors={["#135d3a"]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#f1f5f9",
              marginLeft: 72,
              marginRight: 20,
            }}
          />
        )}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name="activity" size={28} color="#cbd5e1" />
            </View>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              Belum ada aktivitas
            </Text>
            <Text style={{ color: "#cbd5e1", fontSize: 12 }}>
              Log akan muncul saat aset ditambah, diubah, atau dihapus
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color="#135d3a" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
