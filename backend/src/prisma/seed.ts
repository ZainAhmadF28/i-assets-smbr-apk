/**
 * Seed script — buat admin user default
 * Jalankan: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

async function main() {
  console.log("🌱 Starting seed...");

  // Cek apakah admin sudah ada
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("ℹ️  Admin user already exists, skipping.");
  } else {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`✅ Admin user created: ${admin.username}`);
    console.log("   Username : admin");
    console.log("   Password : admin123");
    console.log("   ⚠️  Ganti password ini setelah login pertama!");
  }

  // Seed contoh aset (opsional — hapus jika tidak diperlukan)
  const assetCount = await prisma.asset.count();
  if (assetCount === 0) {
    await prisma.asset.createMany({
      data: [
        {
          nomorAset: "141310000238",
          namaAset: "Pos Satpam Mess Baturaja",
          kategori: "BANGUNAN",
          quantity: 1,
          satuanUnit: "Unit",
          latitude: -4.1283,
          longitude: 104.1720,
          kondisi: "BAIK",
          report: "Kondisi baik, perlu pengecatan ulang.",
        },
        {
          nomorAset: "141310000239",
          namaAset: "Kendaraan Operasional Toyota Avanza",
          kategori: "KENDARAAN_DINAS",
          quantity: 1,
          satuanUnit: "Unit",
          latitude: -4.1290,
          longitude: 104.1715,
          kondisi: "BAIK",
          report: null,
        },
        {
          nomorAset: "141310000240",
          namaAset: "Proyektor Ruang Meeting",
          kategori: "PERLENGKAPAN",
          quantity: 2,
          satuanUnit: "Unit",
          kondisi: "RUSAK",
          report: "Lampu proyektor redup, perlu penggantian.",
        },
      ],
    });
    console.log("✅ Sample assets created (3 items)");
  }

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
