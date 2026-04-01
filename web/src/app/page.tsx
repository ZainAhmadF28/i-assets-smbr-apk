"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { GuardedPage } from "@/components/layout/GuardedPage";
import AppShell from "@/components/layout/AppShell";
import KondisiBadge from "@/components/ui/KondisiBadge";
import { timeAgo } from "@/lib/helpers";
import { assetService } from "@/services/assetService";
import type { Asset, AssetStats, Kondisi } from "@/types";

const KELAS_ASET_COLOR: Record<string, string> = {
  BANGUNAN: "#0ea5e9",
  INFRASTRUKTUR: "#f59e0b",
  "KENDARAAN & ALAT BERAT": "#8b5cf6",
  PERLENGKAPAN: "#10b981",
  TANAH: "#ec4899",
};

const KONDISI_CARD_META: Array<{
  key: Kondisi;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "BAIK", label: "Baik", color: "#10b981", icon: CheckCircle2 },
  { key: "RUSAK", label: "Rusak", color: "#f59e0b", icon: TriangleAlert },
  { key: "RUSAK_BERAT", label: "Rusak Berat", color: "#ef4444", icon: XCircle },
  { key: "HILANG", label: "Hilang", color: "#64748b", icon: TriangleAlert },
  { key: "BELUM_DICEK", label: "Belum Dicek", color: "#94a3b8", icon: Clock3 },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await assetService.getAll({
        search: query.trim(),
        page: 1,
        limit: 6,
      });
      setSearchResults(result.data);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const payload = await assetService.getStats();
      setStats(payload);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRecentAssets = useCallback(async () => {
    setAssetsLoading(true);
    try {
      const result = await assetService.getAll({ page: 1, limit: 8 });
      setRecentAssets(result.data);
    } catch {
      setRecentAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentAssets();
  }, [fetchStats, fetchRecentAssets]);

  function onSearchChange(text: string) {
    setSearchQuery(text);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimer.current = setTimeout(() => {
      fetchSearchResults(text);
    }, 250);
  }

  return (
    <GuardedPage>
      <AppShell title="Dashboard Admin" subtitle="Ringkasan I-Asset SMBR">
        <div className="space-y-5">
          <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari nama atau nomor aset..."
                className="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              {searchLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-700" />
              )}
            </div>

            {showDropdown && searchQuery.trim() && (
              <div className="absolute left-5 right-5 top-[76px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-slate-400">Tidak ada aset yang cocok</div>
                ) : (
                  searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/assets/${item.id}`}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="h-11 w-11 overflow-hidden rounded-lg bg-emerald-50">
                        {item.fotoUrl ? (
                          <img
                            src={assetService.getPhotoUrl(item.fotoUrl) || ""}
                            alt={item.namaAset}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-emerald-700">
                            <Box className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{item.namaAset}</p>
                        <p className="text-xs text-slate-500">#{item.nomorAset}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-800 text-white">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Statistik Aset</h2>
                <p className="text-xs text-slate-400">Ringkasan kondisi aset</p>
              </div>
            </div>

            {statsLoading ? (
              <div className="py-6 text-center text-sm text-slate-400">Memuat statistik...</div>
            ) : stats ? (
              <>
                <div className="mb-3 rounded-2xl bg-emerald-800 px-5 py-4 text-white">
                  <p className="text-xs text-emerald-100">Total Aset Tercatat</p>
                  <p className="text-3xl font-black leading-tight">{stats.total}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {KONDISI_CARD_META.map((meta) => {
                    const Icon = meta.icon;
                    return (
                      <Link
                        key={meta.key}
                        href={`/assets?kondisi=${meta.key}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <Icon className="mx-auto mb-1 h-4 w-4" style={{ color: meta.color }} />
                        <p className="text-lg font-black text-emerald-900">
                          {stats.kondisi[meta.key]}
                        </p>
                        <p className="text-[11px] text-slate-500">{meta.label}</p>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">Data tidak tersedia</div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/scan"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs text-slate-400">Aksi Cepat</p>
              <h3 className="mt-1 text-base font-extrabold text-slate-800">Scan QR Code</h3>
              <p className="mt-1 text-sm text-slate-500">Identifikasi aset via kamera</p>
            </Link>
            <Link
              href="/assets"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs text-slate-400">Aksi Cepat</p>
              <h3 className="mt-1 text-base font-extrabold text-slate-800">Lihat Semua Aset</h3>
              <p className="mt-1 text-sm text-slate-500">Telusuri katalog aset perusahaan</p>
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Update Terbaru
            </h2>

            {assetsLoading ? (
              <div className="py-6 text-center text-sm text-slate-400">Memuat update terbaru...</div>
            ) : recentAssets.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">Belum ada data aset</div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {recentAssets.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/assets/${asset.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-emerald-200"
                  >
                    <div className="h-36 bg-slate-200">
                      {asset.fotoUrl ? (
                        <img
                          src={assetService.getPhotoUrl(asset.fotoUrl) || ""}
                          alt={asset.namaAset}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-emerald-700">
                          <Box className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex rounded-full px-2 py-1 text-[10px] font-bold"
                          style={{
                            backgroundColor: `${KELAS_ASET_COLOR[asset.kelasAsetSig || ""] || "#135d3a"}22`,
                            color: KELAS_ASET_COLOR[asset.kelasAsetSig || ""] || "#135d3a",
                          }}
                        >
                          {asset.kelasAsetSig || "Aset"}
                        </span>
                        <KondisiBadge kondisi={asset.kondisi} />
                      </div>
                      <p className="line-clamp-1 text-sm font-extrabold text-slate-800">
                        {asset.namaAset}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{timeAgo(asset.updatedAt)}</span>
                        <span>#{asset.nomorAset}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </GuardedPage>
  );
}
