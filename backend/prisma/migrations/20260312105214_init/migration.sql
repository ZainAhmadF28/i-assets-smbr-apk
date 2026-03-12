-- CreateEnum
CREATE TYPE "Kondisi" AS ENUM ('BAIK', 'RUSAK', 'RUSAK_BERAT', 'HILANG', 'BELUM_DICEK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "kode_kelas" TEXT,
    "kelas_aset_smbr" TEXT,
    "kelas_aset_sig" TEXT,
    "nomor_aset" TEXT NOT NULL,
    "nama_aset" TEXT NOT NULL,
    "site" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "satuan" TEXT DEFAULT 'PC',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "tanggal_update" TIMESTAMP(3),
    "foto_url" TEXT,
    "kondisi" "Kondisi" NOT NULL DEFAULT 'BELUM_DICEK',
    "keterangan" TEXT,
    "qr_code_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_logs" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assets_nomor_aset_key" ON "assets"("nomor_aset");

-- AddForeignKey
ALTER TABLE "asset_logs" ADD CONSTRAINT "asset_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_logs" ADD CONSTRAINT "asset_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
