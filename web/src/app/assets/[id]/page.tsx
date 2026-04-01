"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Map,
  Pencil,
  Printer,
  Trash2,
  Upload,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { GuardedPage } from "@/components/layout/GuardedPage";
import KondisiBadge from "@/components/ui/KondisiBadge";
import { toLocaleDateTime } from "@/lib/helpers";
import { printQrPdf } from "@/lib/qrPdf";
import { assetService } from "@/services/assetService";
import type { Asset } from "@/types";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    async function loadAsset() {
      try {
        const data = await assetService.getById(id);
        setAsset(data);
      } catch {
        window.alert("Aset tidak ditemukan");
        router.replace("/assets");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadAsset();
    }
  }, [id, router]);

  const photoUrl = useMemo(() => {
    if (!asset) return null;
    return assetService.getPhotoUrl(asset.fotoUrl);
  }, [asset]);

  const qrUrl = useMemo(() => {
    if (!asset) return "";
    return assetService.getQrUrl(asset.id);
  }, [asset]);

  const mapEmbedUrl = useMemo(() => {
    if (!asset?.latitude || !asset?.longitude) return "";

    const lat = asset.latitude;
    const lng = asset.longitude;
    const delta = 0.01;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [asset]);

  async function onUploadPhoto(file: File) {
    if (!asset) return;

    setUploadingPhoto(true);
    try {
      const updated = await assetService.uploadPhoto(asset.id, file);
      setAsset(updated);
      window.alert("Foto aset berhasil diperbarui");
    } catch {
      window.alert("Gagal mengupload foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;

    const yes = window.confirm(
      `Yakin ingin menghapus aset \"${asset.namaAset}\"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!yes) return;

    setDeleting(true);
    try {
      await assetService.remove(asset.id);
      window.alert("Aset berhasil dihapus");
      router.replace("/assets");
    } catch {
      window.alert("Gagal menghapus aset");
      setDeleting(false);
    }
  }

  async function handlePrintQr() {
    if (!asset) return;

    setPrinting(true);
    try {
      await printQrPdf(asset);
    } catch {
      window.alert("Gagal membuat PDF QR");
    } finally {
      setPrinting(false);
    }
  }

  if (loading) {
    return (
      <GuardedPage>
        <AppShell title="Detail Aset">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Memuat detail aset...
          </div>
        </AppShell>
      </GuardedPage>
    );
  }

  if (!asset) return null;

  return (
    <GuardedPage>
      <AppShell
        title="Detail Aset"
        subtitle={`#${asset.nomorAset}`}
        actions={
          <Link
            href={`/assets/${asset.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        }
      >
        <div className="space-y-4">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-64 bg-slate-200">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={asset.namaAset}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-400">
                  Foto belum tersedia
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-xs font-bold text-white"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                Update Foto
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadPhoto(file);
                  }
                  e.currentTarget.value = "";
                }}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-mono text-slate-400">{asset.nomorAset}</p>
            <h1 className="mt-1 text-xl font-black text-slate-900">{asset.namaAset}</h1>
            <div className="mt-3">
              <KondisiBadge kondisi={asset.kondisi} />
            </div>

            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm">
              <InfoRow label="Kelas SIG" value={asset.kelasAsetSig || "-"} />
              <InfoRow label="Kelas SMBR" value={asset.kelasAsetSmbr || "-"} />
              <InfoRow label="Site" value={asset.site || "-"} />
              <InfoRow label="Jumlah" value={`${asset.qty} ${asset.satuan || "PC"}`} />
              <InfoRow label="Terakhir Update" value={toLocaleDateTime(asset.updatedAt)} />
            </div>
          </section>

          {asset.keterangan && (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-extrabold text-slate-800">Catatan / Keterangan</h2>
              <p className="text-sm leading-relaxed text-slate-600">{asset.keterangan}</p>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-extrabold text-slate-800">Lokasi Aset</h2>
            {asset.latitude && asset.longitude ? (
              <>
                <p className="mb-2 text-xs text-slate-500">
                  {asset.latitude.toFixed(6)}, {asset.longitude.toFixed(6)}
                </p>
                <iframe
                  src={mapEmbedUrl}
                  className="h-64 w-full rounded-2xl border border-slate-200"
                  loading="lazy"
                  title="Peta lokasi aset"
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${asset.latitude},${asset.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Map className="h-4 w-4" />
                  Buka di Google Maps
                </a>
              </>
            ) : (
              <p className="text-sm text-slate-400">Koordinat belum tersedia</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800">QR Code Aset</h2>
            <img src={qrUrl} alt="QR Aset" className="mx-auto mt-3 h-48 w-48" />
            <p className="mt-1 font-mono text-xs text-slate-400">{asset.id}</p>

            <button
              type="button"
              onClick={handlePrintQr}
              disabled={printing}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Cetak QR Code (PDF)
            </button>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700">
              <Upload className="h-4 w-4" />
              Upload Foto Baru
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadPhoto(file);
                  }
                }}
              />
            </label>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus Aset
            </button>
          </div>
        </div>
      </AppShell>
    </GuardedPage>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}
