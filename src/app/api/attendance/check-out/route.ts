import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getBangkokNow, formatDate, formatTime } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional photo and GPS data from request body
    let photo = '';
    let latitude = '';
    let longitude = '';
    try {
      const body = await request.json();
      if (body.photo) photo = String(body.photo);
      if (body.latitude) latitude = String(body.latitude);
      if (body.longitude) longitude = String(body.longitude);
    } catch {
      // Body may be empty or invalid JSON – that's okay, fields stay empty
    }

    const bangkokNow = getBangkokNow();
    const today = formatDate(bangkokNow);
    const checkOutTime = formatTime(bangkokNow);

    // Find today's attendance record
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Must check in first before checking out' },
        { status: 400 }
      );
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { error: 'Already checked out today' },
        { status: 400 }
      );
    }

    const attendance = await db.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: checkOutTime,
        checkOutPhoto: photo,
        checkOutLat: latitude,
        checkOutLng: longitude,
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
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Failed to check out' },
      { status: 500 }
    );
  }
}
