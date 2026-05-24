import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getBangkokNow, formatDate } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bangkokNow = getBangkokNow();
    const today = formatDate(bangkokNow);

    const attendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
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
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Get today attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today attendance' },
      { status: 500 }
    );
  }
}
