/**
 * Debug script: Cek data asset_logs langsung dari DB Supabase
 * Jalankan: ts-node debug-logs.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== DEBUG: Cek tabel asset_logs ===\n");

  // 1. Hitung total logs
  const total = await prisma.assetLog.count();
  console.log(`📊 Total asset_logs di DB: ${total}`);

  if (total === 0) {
    console.log("\n❌ TIDAK ADA DATA di tabel asset_logs!");
    console.log("   → Kemungkinan: backend di Railway belum di-deploy ulang,");
    console.log("     sehingga log belum pernah dibuat saat update/upload foto.\n");
  } else {
    // 2. Tampilkan 5 log terbaru
    const logs = await prisma.assetLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { asset: { select: { namaAset: true } } },
    });

    console.log("\n✅ 5 Log terbaru:");
    for (const log of logs) {
      console.log(`  - [${log.createdAt.toISOString()}] ${log.action}`);
      console.log(`    Asset: ${log.asset?.namaAset ?? log.namaAset ?? "?"}`);
      console.log(`    Catatan: ${log.catatan ?? "-"}`);
      console.log();
    }

    // 3. Cek apakah ada log tanpa assetId (orphan)
    const orphans = await prisma.assetLog.count({ where: { assetId: null } });
    console.log(`⚠️  Log tanpa assetId (orphan/dihapus): ${orphans}`);
  }

  // 4. Ambil satu asset nyata dan cek logsnya
  const sampleAsset = await prisma.asset.findFirst({ orderBy: { updatedAt: "desc" } });
  if (sampleAsset) {
    const assetLogs = await prisma.assetLog.findMany({
      where: { assetId: sampleAsset.id },
      orderBy: { createdAt: "desc" },
    });
    console.log(`\n🔍 Asset terbaru: "${sampleAsset.namaAset}" (${sampleAsset.id})`);
    console.log(`   Jumlah log untuk asset ini: ${assetLogs.length}`);
    if (assetLogs.length > 0) {
      console.log(`   Log terbaru: [${assetLogs[0].action}] — ${assetLogs[0].catatan}`);
    }
  }

  console.log("\n=== SELESAI ===\n");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
