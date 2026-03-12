import { Request, Response } from "express";
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

  const kondisiMap: Record<string, number> = { BAIK: 0, RUSAK: 0, RUSAK_BERAT: 0, HILANG: 0 };
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
export async function createAsset(req: Request, res: Response): Promise<void> {
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
      action: "CREATED",
      assetId: asset.id,
      catatan: `Aset baru ditambahkan — kelas SIG ${asset.kelasAsetSig}, kondisi ${asset.kondisi}`,
    },
  });

  res.status(201).json(asset);
}

// ── PUT /api/assets/:id ───────────────────────────────────────────────────────
export async function updateAsset(req: Request, res: Response): Promise<void> {
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

  await prisma.assetLog.create({
    data: {
      assetId: asset.id,
      action: "UPDATED",
      catatan: "Data aset diperbarui",
    },
  });

  res.json(asset);
}

// ── DELETE /api/assets/:id ────────────────────────────────────────────────────
export async function deleteAsset(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.asset.findUnique({ where: { id: String(id) } });
  if (!existing) {
    res.status(404).json({ message: "Aset tidak ditemukan." });
    return;
  }

  await prisma.asset.delete({ where: { id: String(id) } });

  // Peringatan: Karena onDelete Cascade, kita tidak bisa menyimpan assetLog 
  // yang merujuk ke assetId yang sudah dihapus tanpa mengubah schema prisma.
  // Untuk saat ini, kita lewatkan logging DELETE ke assetLog jika asset terhapus.

  res.status(204).send();
}

// ── POST /api/assets/:id/photo ────────────────────────────────────────────────
export async function uploadPhoto(req: Request, res: Response): Promise<void> {
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
      action: "PHOTO_UPLOADED",
      assetId: asset.id,
      catatan: "Foto aset diperbarui",
    },
  });

  res.json(asset);
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
