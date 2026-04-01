import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import QRCode from "qrcode";
import prisma from "../lib/prisma";

// Enum 'Kategori' was removed from the schema, but we still use 'Kondisi'
type Kondisi = "BAIK" | "RUSAK" | "RUSAK_BERAT" | "HILANG" | "BELUM_DICEK";

// ── GET /api/assets/stats ────────────────────────────────────────────────────
export async function getAssetStats(_req: Request, res: Response): Promise<void> {
  const [total, byKondisi] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({
      by: ["kondisi"],
      _count: { kondisi: true },
    }),
  ]);

  const kondisiMap: Record<string, number> = { BAIK: 0, RUSAK: 0, RUSAK_BERAT: 0, HILANG: 0, BELUM_DICEK: 0 };
  for (const row of byKondisi) {
    kondisiMap[row.kondisi] = row._count.kondisi;
  }

  res.json({ total, kondisi: kondisiMap });
}

// ── GET /api/assets ─────────────────────────────────────────────────────────
export async function getAssets(req: Request, res: Response): Promise<void> {
  const { search, kategori, kondisi, page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const whereFilter: {
    OR?: { namaAset?: { contains: string; mode: "insensitive" }; nomorAset?: { contains: string; mode: "insensitive" } }[];
    kelasAsetSig?: string;
    kondisi?: Kondisi;
  } = {};

  if (search) {
    whereFilter.OR = [
      { namaAset: { contains: search, mode: "insensitive" } },
      { nomorAset: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filter based on the standardized SIG grouping
  if (kategori) {
    whereFilter.kelasAsetSig = kategori;
  }

  if (kondisi && ["BAIK", "RUSAK", "RUSAK_BERAT", "HILANG", "BELUM_DICEK"].includes(kondisi)) {
    whereFilter.kondisi = kondisi as Kondisi;
  }

  const [data, total] = await Promise.all([
    prisma.asset.findMany({ where: whereFilter, skip, take: limitNum, orderBy: { updatedAt: "desc" } }),
    prisma.asset.count({ where: whereFilter }),
  ]);

  res.json({ data, total, page: pageNum, limit: limitNum });
}

// ── GET /api/assets/:id ──────────────────────────────────────────────────────
export async function getAssetById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const asset = await prisma.asset.findUnique({ where: { id: String(id) } });

  if (!asset) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  res.json(asset);
}

// ── POST /api/assets ─────────────────────────────────────────────────────────
export async function createAsset(req: AuthRequest, res: Response): Promise<void> {
  const {
    nomorAset, namaAset, kodeKelas, kelasAsetSmbr, kelasAsetSig,
    site, qty, satuan, latitude, longitude, kondisi, keterangan,
  } = req.body as Record<string, string | number | null>;

  if (!nomorAset || !namaAset) {
    res.status(400).json({ message: "nomorAset dan namaAset wajib diisi." });
    return;
  }

  const existing = await prisma.asset.findUnique({ where: { nomorAset: String(nomorAset) } });
  if (existing) {
    res.status(409).json({ message: "Nomor aset sudah digunakan." });
    return;
  }

  const asset = await prisma.asset.create({
    data: {
      nomorAset: String(nomorAset),
      namaAset: String(namaAset),
      kodeKelas: kodeKelas ? String(kodeKelas) : null,
      kelasAsetSmbr: kelasAsetSmbr ? String(kelasAsetSmbr) : null,
      kelasAsetSig: kelasAsetSig ? String(kelasAsetSig) : null,
      site: site ? String(site) : null,
      qty: qty ? Number(qty) : 1,
      satuan: satuan ? String(satuan) : "PC",
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      kondisi: (kondisi as Kondisi) || "BELUM_DICEK",
      keterangan: keterangan ? String(keterangan) : null,
    },
  });

  await prisma.assetLog.create({
    data: {
      action: "Tambah Aset",
      assetId: asset.id,
      namaAset: asset.namaAset,
      nomorAset: asset.nomorAset,
      userId: req.user?.id,
      catatan: `Aset baru ditambahkan — kelas SIG ${asset.kelasAsetSig || '-'}, kondisi ${asset.kondisi}`,
    },
  });

  res.status(201).json(asset);
}

// ── PUT /api/assets/:id ───────────────────────────────────────────────────────
export async function updateAsset(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const {
    nomorAset, namaAset, kodeKelas, kelasAsetSmbr, kelasAsetSig,
    site, qty, satuan, latitude, longitude, kondisi, keterangan,
  } = req.body as Record<string, string | number | null | undefined>;

  const existing = await prisma.asset.findUnique({ where: { id: String(id) } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  // Cek duplikat nomorAset jika diubah
  if (nomorAset && nomorAset !== existing.nomorAset) {
    const conflict = await prisma.asset.findUnique({ where: { nomorAset: String(nomorAset) } });
    if (conflict) {
      res.status(409).json({ message: "Nomor aset sudah digunakan oleh aset lain." });
      return;
    }
  }

  const asset = await prisma.asset.update({
    where: { id: String(id) },
    data: {
      ...(nomorAset != null && { nomorAset: String(nomorAset) }),
      ...(namaAset != null && { namaAset: String(namaAset) }),
      kodeKelas: kodeKelas !== undefined ? (kodeKelas != null ? String(kodeKelas) : null) : undefined,
      kelasAsetSmbr: kelasAsetSmbr !== undefined ? (kelasAsetSmbr != null ? String(kelasAsetSmbr) : null) : undefined,
      kelasAsetSig: kelasAsetSig !== undefined ? (kelasAsetSig != null ? String(kelasAsetSig) : null) : undefined,
      site: site !== undefined ? (site != null ? String(site) : null) : undefined,
      ...(qty != null && { qty: Number(qty) }),
      ...(satuan != null && { satuan: String(satuan) }),
      latitude: latitude !== undefined ? (latitude != null ? Number(latitude) : null) : undefined,
      longitude: longitude !== undefined ? (longitude != null ? Number(longitude) : null) : undefined,
      ...(kondisi != null && { kondisi: kondisi as Kondisi }),
      keterangan: keterangan !== undefined ? (keterangan != null ? String(keterangan) : null) : undefined,
    },
  });

  // Kumpulkan semua field yang berubah dalam satu sesi edit
  type ChangeItem = { field: string; from: string; to: string };
  const changes: ChangeItem[] = [];

  if (nomorAset != null && nomorAset !== existing.nomorAset)
    changes.push({ field: "Nomor Aset", from: existing.nomorAset, to: String(nomorAset) });

  if (namaAset != null && namaAset !== existing.namaAset)
    changes.push({ field: "Nama", from: existing.namaAset, to: String(namaAset) });

  if (kelasAsetSig !== undefined && kelasAsetSig !== existing.kelasAsetSig)
    changes.push({ field: "Kategori", from: existing.kelasAsetSig || "Kosong", to: String(kelasAsetSig || "Kosong") });

  if (kondisi != null && kondisi !== existing.kondisi)
    changes.push({ field: "Kondisi", from: existing.kondisi, to: String(kondisi) });

  if (site !== undefined && site !== existing.site)
    changes.push({ field: "Site", from: existing.site || "Kosong", to: String(site || "Kosong") });

  if (qty != null && Number(qty) !== existing.qty)
    changes.push({ field: "Jumlah", from: String(existing.qty), to: String(qty) });

  if (satuan != null && satuan !== existing.satuan)
    changes.push({ field: "Satuan", from: existing.satuan || "-", to: String(satuan) });

  const latChanged = latitude !== undefined && Number(latitude ?? 0) !== Number(existing.latitude ?? 0);
  const lonChanged = longitude !== undefined && Number(longitude ?? 0) !== Number(existing.longitude ?? 0);
  if (latChanged || lonChanged)
    changes.push({
      field: "Koordinat GPS",
      from: existing.latitude != null ? `${existing.latitude}, ${existing.longitude}` : "Kosong",
      to: latitude != null ? `${latitude}, ${longitude}` : "Kosong",
    });

  if (keterangan !== undefined && keterangan !== existing.keterangan)
    changes.push({ field: "Keterangan", from: existing.keterangan || "Kosong", to: String(keterangan || "Kosong") });

  if (changes.length > 0) {
    // Satu log entry per sesi edit — merangkum semua field yang berubah
    const fieldList = changes.map((c) => c.field).join(", ");
    const catatanLines = changes.map((c) => `• ${c.field}: "${c.from}" → "${c.to}"`).join("\n");

    await prisma.assetLog.create({
      data: {
        assetId: asset.id,
        namaAset: asset.namaAset,
        nomorAset: asset.nomorAset,
        userId: req.user?.id,
        action: `Edit: ${fieldList}`,
        catatan: catatanLines,
        newValue: JSON.stringify(changes),
      },
    });
  } else {
    // Fallback: tidak ada field yang benar-benar berubah nilainya
    await prisma.assetLog.create({
      data: {
        assetId: asset.id,
        namaAset: asset.namaAset,
        nomorAset: asset.nomorAset,
        userId: req.user?.id,
        action: "Pembaruan Data",
        catatan: "Tidak ada perubahan data yang terdeteksi.",
      },
    });
  }

  res.json(asset);
}

// ── DELETE /api/assets/:id ────────────────────────────────────────────────────
export async function deleteAsset(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id: String(id) } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  // Buat log terlebih dahulu agar masih merujuk ke data yang benar
  // Meski relasi akan putus saat delete (SetNull), namaAset dan tabel akan tetap tersimpan
  await prisma.assetLog.create({
    data: {
      action: "Hapus Aset",
      namaAset: existing.namaAset,
      nomorAset: existing.nomorAset,
      userId: req.user?.id,
      catatan: "Aset dibongkar atau dihapus dari sistem",
    }
  });

  await prisma.asset.delete({ where: { id: String(id) } });

  res.status(204).send();
}

// ── POST /api/assets/:id/photo ────────────────────────────────────────────────
export async function uploadPhoto(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id: String(id) } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "File foto wajib disertakan." });
    return;
  }

  // Path yang disimpan di DB — relatif dari server (di-serve sebagai static)
  const fotoUrl = `/uploads/${req.file.filename}`;

  const asset = await prisma.asset.update({
    where: { id: String(id) },
    data: {
      fotoUrl,
    },
  });

  await prisma.assetLog.create({
    data: {
      action: "Update Foto",
      assetId: asset.id,
      namaAset: asset.namaAset,
      nomorAset: asset.nomorAset,
      userId: req.user?.id,
      oldValue: existing.fotoUrl || "Kosong",
      newValue: fotoUrl,
      catatan: `Foto aset diperbarui dari ${existing.fotoUrl || 'Kosong'} menjadi ${fotoUrl}`,
    },
  });

  res.json(asset);
}

// ── GET /api/assets/:id/logs ────────────────────────────────────────────────
export async function getAssetLogs(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const logs = await prisma.assetLog.findMany({
    where: { assetId: String(id) },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  res.json(logs);
}

// ── GET /api/assets/:id/qrcode ────────────────────────────────────────────────
export async function getQrCode(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id: String(id) }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  // QR Code berisi plain asset ID
  const qrDataUrl = await QRCode.toDataURL(String(id), {
    width: 400,
    margin: 2,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  // Kirim sebagai PNG image
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "public, max-age=86400"); // cache 1 hari
  res.send(buffer);
}
