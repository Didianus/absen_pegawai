import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/barang - List all items (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { kode: { contains: search } },
        { kategori: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      db.barang.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.barang.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get barang error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/barang - Create a new item (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { kode, nama, kategori, satuan, stok, deskripsi } = body;

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama barang wajib diisi' }, { status: 400 });
    }

    const existing = await db.barang.findUnique({ where: { kode } });
    if (existing) {
      return NextResponse.json({ error: 'Kode barang sudah ada' }, { status: 409 });
    }

    const item = await db.barang.create({
      data: {
        kode,
        nama,
        kategori: kategori || '',
        satuan: satuan || '',
        stok: stok || 0,
        deskripsi: deskripsi || '',
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create barang error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
