"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grid3X3, List, Search, SlidersHorizontal, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { GuardedPage } from "@/components/layout/GuardedPage";
import KondisiBadge from "@/components/ui/KondisiBadge";
import { assetService } from "@/services/assetService";
import {
  KATEGORI_OPTIONS,
  KONDISI_OPTIONS,
  type Asset,
  type Kondisi,
} from "@/types";

const PAGE_SIZE = 50;

export default function AssetListPage() {
  const queryParams = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

  const activeFilterCount =
    (filterKategori ? 1 : 0) + (filterKondisi ? 1 : 0);

  useEffect(() => {
    const kondisiFromQuery = queryParams.get("kondisi") || "";
    setFilterKondisi(kondisiFromQuery);
  }, [queryParams]);

  const loadAssets = useCallback(
    async (targetPage: number, reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const result = await assetService.getAll({
          search: search || undefined,
          kategori: filterKategori || undefined,
          kondisi: (filterKondisi as Kondisi) || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        });

        setAssets((prev) => {
          const merged = reset ? result.data : [...prev, ...result.data];
          const unique = new Map<string, Asset>();
          merged.forEach((item) => unique.set(item.id, item));
          return Array.from(unique.values());
        });

        setTotal(result.total);
        setPage(targetPage);
        setHasMore(result.data.length >= PAGE_SIZE);
      } catch {
        if (reset) {
          setAssets([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, filterKategori, filterKondisi]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets(1, true);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadAssets]);

  const kategoriLabel = useMemo(
    () => KATEGORI_OPTIONS.find((opt) => opt.value === filterKategori)?.label,
    [filterKategori]
  );

  const kondisiLabel = useMemo(
    () => KONDISI_OPTIONS.find((opt) => opt.value === filterKondisi)?.label,
    [filterKondisi]
  );

  return (
    <GuardedPage>
      <AppShell title="Daftar Aset" subtitle={`${total} item aset`}>
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full bg-transparent text-sm text-slate-800 outline-none"
                  placeholder="Cari aset..."
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`grid h-10 w-10 place-items-center rounded-lg border ${
                  viewMode === "card"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`grid h-10 w-10 place-items-center rounded-lg border ${
                  viewMode === "list"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-500">
                Kategori
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Semua</option>
                  {KATEGORI_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-500">
                Kondisi
                <select
                  value={filterKondisi}
                  onChange={(e) => setFilterKondisi(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="">Semua Kondisi</option>
                  {KONDISI_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">
                  <SlidersHorizontal className="h-3 w-3" />
                  Filter aktif
                </span>
                {filterKategori && (
                  <button
                    type="button"
                    onClick={() => setFilterKategori("")}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-3 py-1 font-semibold text-white"
                  >
                    {kategoriLabel}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {filterKondisi && (
                  <button
                    type="button"
                    onClick={() => setFilterKondisi("")}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-3 py-1 font-semibold text-white"
                  >
                    {kondisiLabel}
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Memuat data aset...</div>
            ) : assets.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">Tidak ada data aset</div>
            ) : viewMode === "card" ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
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
                        <div className="grid h-full w-full place-items-center text-slate-400">
                          Tidak ada foto
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-extrabold text-slate-800">
                          {asset.namaAset}
                        </p>
                        <KondisiBadge kondisi={asset.kondisi} />
                      </div>
                      <p className="text-xs text-slate-500">#{asset.nomorAset}</p>
                      <p className="text-xs text-slate-400">{asset.kelasAsetSig || "-"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3">Nomor</th>
                      <th className="px-3">Nama Aset</th>
                      <th className="px-3">Kategori</th>
                      <th className="px-3">Kondisi</th>
                      <th className="px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id} className="rounded-xl bg-slate-50">
                        <td className="px-3 py-3 font-semibold text-slate-700">
                          {asset.nomorAset}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{asset.namaAset}</td>
                        <td className="px-3 py-3 text-slate-500">
                          {asset.kelasAsetSig || "-"}
                        </td>
                        <td className="px-3 py-3">
                          <KondisiBadge kondisi={asset.kondisi} />
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasMore && !loading && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => loadAssets(page + 1)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-70"
                >
                  {loadingMore ? "Memuat..." : "Muat Lagi"}
                </button>
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </GuardedPage>
  );
}
