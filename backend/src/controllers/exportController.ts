import { Request, Response } from "express";
import ExcelJS from "exceljs";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";

export async function exportTableToExcel(req: Request, res: Response): Promise<void> {
  try {
    const { table } = req.params;
    const tableStr = String(table);
    const { search } = req.query as Record<string, string>;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(tableStr.toUpperCase());

    if (tableStr === "aset") {
      // ── Export Aset ──
      sheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Nomor Aset", key: "nomorAset", width: 20 },
        { header: "Nama Aset", key: "namaAset", width: 30 },
        { header: "Kode Kelas", key: "kodeKelas", width: 15 },
        { header: "Kelas SMBR", key: "kelasAsetSmbr", width: 25 },
        { header: "Kategori SIG", key: "kelasAsetSig", width: 20 },
        { header: "Kondisi", key: "kondisi", width: 15 },
        { header: "QTY", key: "qty", width: 10 },
        { header: "Satuan", key: "satuan", width: 10 },
        { header: "Site", key: "site", width: 20 },
        { header: "Latitude", key: "latitude", width: 15 },
        { header: "Longitude", key: "longitude", width: 15 },
        { header: "Tgl Update", key: "tanggalUpdate", width: 20 },
        { header: "Keterangan", key: "keterangan", width: 30 },
        { header: "Foto", key: "foto", width: 14 },
        { header: "QR Code", key: "qr", width: 14 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Updated At", key: "updatedAt", width: 20 },
      ];

      // Styling header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const whereFilter: any = {};
      if (search) {
        whereFilter.OR = [
          { namaAset: { contains: search, mode: "insensitive" } },
          { nomorAset: { contains: search, mode: "insensitive" } },
        ];
      }

      const assets = await prisma.asset.findMany({
        where: whereFilter,
        orderBy: { updatedAt: "desc" },
      });

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const rowIndex = i + 2; // Row 1 is header
        const row = sheet.getRow(rowIndex);

        row.height = 70; // Make row tall enough for images
        row.alignment = { vertical: "middle" };

        row.values = {
          no: i + 1,
          nomorAset: asset.nomorAset,
          namaAset: asset.namaAset,
          kodeKelas: asset.kodeKelas || "-",
          kelasAsetSmbr: asset.kelasAsetSmbr || "-",
          kelasAsetSig: asset.kelasAsetSig || "-",
          kondisi: asset.kondisi,
          qty: asset.qty,
          satuan: asset.satuan || "-",
          site: asset.site || "-",
          latitude: asset.latitude || "-",
          longitude: asset.longitude || "-",
          tanggalUpdate: asset.tanggalUpdate ? new Date(asset.tanggalUpdate).toLocaleString() : "-",
          keterangan: asset.keterangan || "-",
          createdAt: asset.createdAt ? new Date(asset.createdAt).toLocaleString() : "-",
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : "-",
        };

        // Add Foto if exists
        try {
          if (asset.fotoUrl && !asset.fotoUrl.startsWith("http")) {
            const photoPath = path.join(__dirname, "../../", asset.fotoUrl); // e.g. /uploads/123.jpg
            if (fs.existsSync(photoPath)) {
              const imageId = workbook.addImage({
                filename: photoPath,
                extension: path.extname(photoPath).substring(1) as any,
              });
              sheet.addImage(imageId, {
                tl: { col: 14 + 0.15, row: rowIndex - 1 + 0.15 } as any, // Column O (Foto)
                ext: { width: 60, height: 60 },
                editAs: "oneCell",
              });
            }
          }
        } catch (e) {
          console.error("Failed to embed photo:", e);
        }

        // Generate and Add QR Code
        try {
          if (asset.nomorAset) {
            const qrBase64 = await QRCode.toDataURL(asset.nomorAset, { margin: 1 });
            const imageId = workbook.addImage({
              base64: qrBase64,
              extension: "png",
            });
            sheet.addImage(imageId, {
              tl: { col: 15 + 0.15, row: rowIndex - 1 + 0.15 } as any, // Column P (QR Code)
              ext: { width: 60, height: 60 },
              editAs: "oneCell",
            });
          }
        } catch (e) {
          console.error("Failed to embed QR:", e);
        }
      }
    } else if (tableStr === "user") {
      // ── Export User ──
      sheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Nama", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 15 },
        { header: "Dibuat", key: "createdAt", width: 20 },
      ];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      users.forEach((u, i) => {
        sheet.addRow({
          no: i + 1,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toLocaleString(),
        });
      });
    } else if (tableStr === "log") {
      // ── Export Log ──
      sheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Aksi", key: "action", width: 15 },
        { header: "Aset", key: "assetName", width: 30 },
        { header: "Nomor Aset", key: "assetNomor", width: 20 },
        { header: "Catatan", key: "catatan", width: 40 },
        { header: "Waktu", key: "createdAt", width: 25 },
      ];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const logs = await prisma.assetLog.findMany({
        include: { asset: true },
        orderBy: { createdAt: "desc" },
      });
      logs.forEach((log, i) => {
        sheet.addRow({
          no: i + 1,
          action: log.action,
          assetName: log.asset?.namaAset || "Dihapus",
          assetNomor: log.asset?.nomorAset || "-",
          catatan: log.catatan || "-",
          createdAt: log.createdAt.toLocaleString(),
        });
      });
    } else {
      res.status(400).json({ error: "Tabel tidak valid" });
      return;
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="export_${tableStr}_${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Gagal menyusun Excel" });
  }
}
