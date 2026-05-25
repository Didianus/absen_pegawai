-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "position" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checkIn" TEXT,
    "checkOut" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT NOT NULL DEFAULT '',
    "checkInPhoto" TEXT NOT NULL DEFAULT '',
    "checkOutPhoto" TEXT NOT NULL DEFAULT '',
    "checkInLat" TEXT NOT NULL DEFAULT '',
    "checkInLng" TEXT NOT NULL DEFAULT '',
    "checkOutLat" TEXT NOT NULL DEFAULT '',
    "checkOutLng" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Barang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT '',
    "satuan" TEXT NOT NULL DEFAULT '',
    "stok" INTEGER NOT NULL DEFAULT 0,
    "deskripsi" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BarangMasuk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barangId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL DEFAULT '',
    "penerimaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BarangMasuk_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BarangMasuk_penerimaId_fkey" FOREIGN KEY ("penerimaId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BarangKeluar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barangId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL DEFAULT '',
    "pengeluarId" TEXT NOT NULL,
    "penerimaNama" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BarangKeluar_barangId_fkey" FOREIGN KEY ("barangId") REFERENCES "Barang" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BarangKeluar_pengeluarId_fkey" FOREIGN KEY ("pengeluarId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Barang_kode_key" ON "Barang"("kode");
