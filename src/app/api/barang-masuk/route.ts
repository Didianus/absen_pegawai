import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getBangkokNow, formatDate } from '@/lib/auth';

// GET /api/barang-masuk - List incoming goods records
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('date'); // YYYY-MM-DD
    const filterMonth = searchParams.get('month'); // YYYY-MM
    const filterBarangId = searchParams.get('barangId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: {
      tanggal?: string | { startsWith: string };
      barangId?: string;
    } = {};

    if (filterDate) {
      where.tanggal = filterDate;
    } else if (filterMonth) {
      where.tanggal = { startsWith: filterMonth };
    }
    if (filterBarangId) {
      where.barangId = filterBarangId;
    }

    const [records, total] = await Promise.all([
      db.barangMasuk.findMany({
        where,
        include: {
          barang: { select: { id: true, kode: true, nama: true, satuan: true } },
          penerima: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.barangMasuk.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get barang masuk error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// POST /api/barang-masuk - Create incoming goods record
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { barangId, jumlah, tanggal, keterangan } = body;

    if (!barangId || !jumlah || jumlah <= 0) {
      return NextResponse.json({ error: 'Barang dan jumlah wajib diisi' }, { status: 400 });
    }

    // Verify barang exists
    const barang = await db.barang.findUnique({ where: { id: barangId } });
    if (!barang) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    const bangkokNow = getBangkokNow();
    const recordTanggal = tanggal || formatDate(bangkokNow);

    const record = await db.barangMasuk.create({
      data: {
        barangId,
        jumlah: parseInt(String(jumlah), 10),
        tanggal: recordTanggal,
        keterangan: keterangan || '',
        penerimaId: user.id,
      },
      include: {
        barang: { select: { id: true, kode: true, nama: true, satuan: true } },
        penerima: { select: { id: true, name: true } },
      },
    });

    // Update stock
    await db.barang.update({
      where: { id: barangId },
      data: { stok: { increment: parseInt(String(jumlah), 10) } },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Create barang masuk error:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
