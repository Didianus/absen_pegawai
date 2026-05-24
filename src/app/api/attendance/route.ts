import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');
    const filterDate = searchParams.get('date');
    const filterMonth = searchParams.get('month'); // YYYY-MM
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      userId?: string;
      date?: string | { startsWith: string };
    } = {};

    // Non-admin users can only see their own records
    if (user.role !== 'ADMIN') {
      where.userId = user.id;
    } else if (filterUserId) {
      where.userId = filterUserId;
    }

    if (filterDate) {
      where.date = filterDate;
    } else if (filterMonth) {
      // Match dates starting with YYYY-MM
      where.date = { startsWith: filterMonth };
    }

    const [records, total] = await Promise.all([
      db.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              position: true,
              department: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.attendance.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}
