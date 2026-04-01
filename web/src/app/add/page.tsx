"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Upload } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { GuardedPage } from "@/components/layout/GuardedPage";
import { assetService } from "@/services/assetService";
import { KATEGORI_OPTIONS, KONDISI_OPTIONS, type Kondisi } from "@/types";

type FormState = {
  nomorAset: string;
  namaAset: string;
  kelasAsetSig: string;
  qty: string;
  satuan: string;
  latitude: string;
  longitude: string;
  site: string;
  kondisi: Kondisi;
  keterangan: string;
};

export default function AddAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const [form, setForm] = useState<FormState>({
    nomorAset: "",
    namaAset: "",
    kelasAsetSig: "BANGUNAN",
    qty: "1",
    satuan: "Unit",
    latitude: "",
    longitude: "",
    site: "",
    kondisi: "BAIK",
    keterangan: "",
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const nextErrors: typeof errors = {};
    if (!form.nomorAset.trim()) nextErrors.nomorAset = "Nomor aset wajib diisi";
    if (!form.namaAset.trim()) nextErrors.namaAset = "Nama aset wajib diisi";
    if (!form.qty || Number(form.qty) < 1) nextErrors.qty = "Jumlah wajib angka positif";
    if (form.latitude && Number.isNaN(Number(form.latitude))) {
      nextErrors.latitude = "Latitude harus berupa angka";
    }
    if (form.longitude && Number.isNaN(Number(form.longitude))) {
      nextErrors.longitude = "Longitude harus berupa angka";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function getGPS() {
    if (!navigator.geolocation) {
      window.alert("Browser tidak mendukung GPS");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField("latitude", position.coords.latitude.toFixed(7));
        setField("longitude", position.coords.longitude.toFixed(7));
        setGpsLoading(false);
      },
      () => {
        window.alert("Gagal mendapatkan lokasi GPS");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const created = await assetService.create({
        nomorAset: form.nomorAset.trim(),
        namaAset: form.namaAset.trim(),
        kelasAsetSig: form.kelasAsetSig,
        qty: Number(form.qty),
        satuan: form.satuan.trim() || "Unit",
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        site: form.site.trim() || null,
        kondisi: form.kondisi,
        keterangan: form.keterangan.trim() || null,
      });

      if (photoFile) {
        await assetService.uploadPhoto(created.id, photoFile);
      }

      window.alert("Aset berhasil ditambahkan");
      router.push(`/assets/${created.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Gagal menyimpan data aset";
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuardedPage>
      <AppShell title="Tambah Aset" subtitle="Form penambahan aset baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold text-slate-800">Foto Aset</h2>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <Upload className="h-4 w-4" />
              <span>{photoFile ? photoFile.name : "Pilih foto dari perangkat"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold text-slate-800">Data Aset</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-500">
                Nomor Aset *
                <input
                  value={form.nomorAset}
                  onChange={(e) => setField("nomorAset", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                {errors.nomorAset && <span className="text-[11px] text-red-500">{errors.nomorAset}</span>}
              </label>

              <label className="text-xs text-slate-500 md:col-span-2">
                Nama Aset *
                <input
                  value={form.namaAset}
                  onChange={(e) => setField("namaAset", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                {errors.namaAset && <span className="text-[11px] text-red-500">{errors.namaAset}</span>}
              </label>

              <label className="text-xs text-slate-500">
                Kategori
                <select
                  value={form.kelasAsetSig}
                  onChange={(e) => setField("kelasAsetSig", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
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
                  value={form.kondisi}
                  onChange={(e) => setField("kondisi", e.target.value as Kondisi)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                >
                  {KONDISI_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-500">
                Jumlah *
                <input
                  value={form.qty}
                  onChange={(e) => setField("qty", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  type="number"
                  min={1}
                />
                {errors.qty && <span className="text-[11px] text-red-500">{errors.qty}</span>}
              </label>

              <label className="text-xs text-slate-500">
                Satuan
                <input
                  value={form.satuan}
                  onChange={(e) => setField("satuan", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </label>

              <label className="text-xs text-slate-500 md:col-span-2">
                Site
                <input
                  value={form.site}
                  onChange={(e) => setField("site", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-800">Lokasi GPS</h2>
              <button
                type="button"
                onClick={getGPS}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                {gpsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                Ambil Otomatis
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-500">
                Latitude
                <input
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                {errors.latitude && <span className="text-[11px] text-red-500">{errors.latitude}</span>}
              </label>

              <label className="text-xs text-slate-500">
                Longitude
                <input
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
                {errors.longitude && <span className="text-[11px] text-red-500">{errors.longitude}</span>}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-xs text-slate-500">
              Catatan / Keterangan
              <textarea
                value={form.keterangan}
                onChange={(e) => setField("keterangan", e.target.value)}
                className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan Aset"}
          </button>
        </form>
      </AppShell>
    </GuardedPage>
  );
}
