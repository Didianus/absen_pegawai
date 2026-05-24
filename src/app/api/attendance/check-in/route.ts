import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getBangkokNow, formatDate, formatTime } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bangkokNow = getBangkokNow();
    const today = formatDate(bangkokNow);
    const checkInTime = formatTime(bangkokNow);

    // Check if already checked in today
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      );
    }

    // Determine status: LATE if check-in after 09:00
    const status = checkInTime > '09:00' ? 'LATE' : 'PRESENT';

    const attendance = await db.attendance.create({
      data: {
        userId: user.id,
        date: today,
        checkIn: checkInTime,
        status,
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

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in' },
      { status: 500 }
    );
  }
}
