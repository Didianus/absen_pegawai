import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/barang/[id] - Update item (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { kode, nama, kategori, satuan, stok, deskripsi } = body;

    if (!kode || !nama) {
      return NextResponse.json({ error: 'Kode dan nama barang wajib diisi' }, { status: 400 });
    }

    // Check if kode belongs to another item
    const existing = await db.barang.findUnique({ where: { kode } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Kode barang sudah digunakan oleh item lain' }, { status: 409 });
    }

    const item = await db.barang.update({
      where: { id },
      data: {
        kode,
        nama,
        kategori: kategori || '',
        satuan: satuan || '',
        stok: stok !== undefined ? stok : undefined,
        deskripsi: deskripsi || '',
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Update barang error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/barang/[id] - Delete item (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await params;

    await db.barang.delete({ where: { id } });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete barang error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
