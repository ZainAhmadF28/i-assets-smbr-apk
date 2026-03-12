import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────
type NotifLog = {
  id: string;
  action: string;
  assetName: string;
  assetNomor: string;
  details: string | null;
  createdAt: string;
};

type NotificationContextType = {
  unreadCount: number;
  markAsSeen: () => void;
};

const ACTION_LABELS: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  CREATED: { label: "Aset Ditambahkan", icon: "plus-circle", color: "#10b981", bg: "#d1fae5" },
  UPDATED: { label: "Aset Diperbarui", icon: "edit-3", color: "#3b82f6", bg: "#dbeafe" },
  DELETED: { label: "Aset Dihapus", icon: "trash-2", color: "#ef4444", bg: "#fee2e2" },
  PHOTO_UPLOADED: { label: "Foto Diupload", icon: "camera", color: "#8b5cf6", bg: "#ede9fe" },
};

const STORAGE_KEY = "@activity_log_last_seen";
const POLL_INTERVAL = 15000; // 15 seconds
const { width: SCREEN_W } = Dimensions.get("window");

// ─── Context ────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markAsSeen: () => {},
});

export const useNotification = () => useContext(NotificationContext);

// ─── Toast Popup Component ──────────────────────────────────────────────────
function ToastPopup({
  log,
  onDismiss,
}: {
  log: NotifLog;
  onDismiss: () => void;
}) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const config = ACTION_LABELS[log.action] ?? ACTION_LABELS.UPDATED;

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={dismiss}
        style={toastStyles.inner}
      >
        {/* Icon */}
        <View style={[toastStyles.iconWrap, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={18} color={config.color} />
        </View>

        {/* Content */}
        <View style={toastStyles.content}>
          <Text style={[toastStyles.label, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={toastStyles.assetName} numberOfLines={1}>
            {log.assetName}
          </Text>
          <Text style={toastStyles.assetNomor} numberOfLines={1}>
            #{log.assetNomor}
            {log.details ? ` · ${log.details}` : ""}
          </Text>
        </View>

        {/* Close */}
        <View style={toastStyles.closeWrap}>
          <Feather name="x" size={14} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  assetName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 1,
  },
  assetNomor: {
    fontSize: 11,
    color: "#94a3b8",
  },
  closeWrap: {
    padding: 4,
    marginLeft: 8,
  },
});

// ─── Provider ───────────────────────────────────────────────────────────────
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastLog, setToastLog] = useState<NotifLog | null>(null);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const lastShownIdRef = useRef<string>("");
  const isFirstPollRef = useRef(true);

  // Load last seen timestamp from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) lastSeenRef.current = val;
    });
  }, []);

  const checkForNewLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/activity-logs/new?since=${encodeURIComponent(
          lastSeenRef.current
        )}`
      );
      const json = await res.json();

      if (json?.count !== undefined) {
        setUnreadCount(json.count);

        // Show toast for the latest new log (only if not already shown and not first poll)
        if (
          !isFirstPollRef.current &&
          json.count > 0 &&
          json.latest?.length > 0 &&
          json.latest[0].id !== lastShownIdRef.current
        ) {
          lastShownIdRef.current = json.latest[0].id;
          setToastLog(json.latest[0]);
        }

        isFirstPollRef.current = false;
      }
    } catch (_) {
      // silent fail
    }
  }, []);

  // Poll for new logs
  useEffect(() => {
    checkForNewLogs();
    const interval = setInterval(checkForNewLogs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForNewLogs]);

  const markAsSeen = useCallback(() => {
    const now = new Date().toISOString();
    lastSeenRef.current = now;
    setUnreadCount(0);
    AsyncStorage.setItem(STORAGE_KEY, now);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, markAsSeen }}>
      {children}
      {toastLog && (
        <ToastPopup
          log={toastLog}
          onDismiss={() => setToastLog(null)}
        />
      )}
    </NotificationContext.Provider>
  );
}
