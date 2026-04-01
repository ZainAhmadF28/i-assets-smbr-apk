"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { activityService } from "@/services/activityService";

type NotificationContextType = {
  unreadCount: number;
  markAsSeen: () => void;
};

const STORAGE_KEY = "activity_log_last_seen";
const POLL_INTERVAL = 15000;

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  markAsSeen: () => undefined,
});

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef(new Date().toISOString());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      lastSeenRef.current = saved;
    }
  }, []);

  const checkForNewLogs = useCallback(async () => {
    try {
      const payload = await activityService.getNewCount(lastSeenRef.current);
      setUnreadCount(payload.count ?? 0);
    } catch {
      // Keep silent to avoid spamming toast when network is unstable.
    }
  }, []);

  useEffect(() => {
    checkForNewLogs();
    const timer = setInterval(checkForNewLogs, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [checkForNewLogs]);

  const markAsSeen = useCallback(() => {
    const now = new Date().toISOString();
    lastSeenRef.current = now;
    localStorage.setItem(STORAGE_KEY, now);
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      unreadCount,
      markAsSeen,
    }),
    [unreadCount, markAsSeen]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
