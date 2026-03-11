-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "Kategori" AS ENUM ('BANGUNAN', 'KENDARAAN_DINAS', 'PERLENGKAPAN', 'TANAH');

-- CreateEnum
CREATE TYPE "Kondisi" AS ENUM ('BAIK', 'RUSAK', 'RUSAK_BERAT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "nomorAset" TEXT NOT NULL,
    "namaAset" TEXT NOT NULL,
    "kategori" "Kategori" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "satuanUnit" TEXT NOT NULL DEFAULT 'Unit',
    "gambar" TEXT,
    "fotoTimestamp" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "kondisi" "Kondisi" NOT NULL DEFAULT 'BAIK',
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_nomorAset_key" ON "Asset"("nomorAset");

-- CreateIndex
CREATE INDEX "Asset_nomorAset_idx" ON "Asset"("nomorAset");

-- CreateIndex
CREATE INDEX "Asset_kategori_idx" ON "Asset"("kategori");

-- CreateIndex
CREATE INDEX "Asset_kondisi_idx" ON "Asset"("kondisi");
