"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Database,
  House,
  List,
  LogOut,
  Plus,
  QrCode,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { cn } from "@/lib/helpers";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  withBadge?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/assets", label: "Aset", icon: List },
  { href: "/add", label: "Tambah", icon: Plus },
  { href: "/scan", label: "Scan", icon: QrCode },
  { href: "/database", label: "Database", icon: Database },
  { href: "/activity-log", label: "Log", icon: Activity, withBadge: true },
];

export default function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount, markAsSeen } = useNotification();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-emerald-800/20 bg-emerald-900 text-white shadow-lg shadow-emerald-950/20">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
              <p className="text-xs text-emerald-100/90">
                {subtitle || `Admin Panel · ${user?.name || "Pengguna"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 md:grid-cols-[230px_1fr] md:px-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-4 md:h-fit">
          <nav className="grid grid-cols-3 gap-2 md:grid-cols-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/activity-log") {
                      markAsSeen();
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition md:justify-start md:text-sm",
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-transparent bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.withBadge && unreadCount > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
