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

    if (user.role === 'ADMIN') {
      // Admin: overall stats
      const totalEmployees = await db.user.count();
      const todayAttendances = await db.attendance.findMany({
        where: { date: today },
      });

      const presentToday = todayAttendances.filter(
        (a) => a.status === 'PRESENT'
      ).length;
      const lateToday = todayAttendances.filter(
        (a) => a.status === 'LATE'
      ).length;
      const absentToday = totalEmployees - todayAttendances.length;
      const attendanceRate =
        totalEmployees > 0
          ? Math.round(
              ((presentToday + lateToday) / totalEmployees) * 100
            )
          : 0;

      // Last 7 days summary for charts
      const last7Days: { date: string; present: number; late: number; absent: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(bangkokNow);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);

        const dayAttendances = await db.attendance.findMany({
          where: { date: dateStr },
        });

        const dayPresent = dayAttendances.filter(
          (a) => a.status === 'PRESENT'
        ).length;
        const dayLate = dayAttendances.filter(
          (a) => a.status === 'LATE'
        ).length;

        last7Days.push({
          date: dateStr,
          present: dayPresent,
          late: dayLate,
          absent: totalEmployees - dayAttendances.length,
        });
      }

      return NextResponse.json({
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
        attendanceRate,
        last7Days,
      });
    } else {
      // Regular user: personal stats
      const myAttendances = await db.attendance.findMany({
        where: { userId: user.id },
      });

      const todayRecord = myAttendances.find((a) => a.date === today);
      const presentDays = myAttendances.filter(
        (a) => a.status === 'PRESENT'
      ).length;
      const lateDays = myAttendances.filter(
        (a) => a.status === 'LATE'
      ).length;
      const totalDays = myAttendances.length;
      const attendanceRate =
        totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

      // Last 7 days for user
      const last7Days: { date: string; status: string; checkIn: string | null; checkOut: string | null }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(bangkokNow);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);

        const dayRecord = myAttendances.find((a) => a.date === dateStr);

        last7Days.push({
          date: dateStr,
          status: dayRecord ? dayRecord.status : 'ABSENT',
          checkIn: dayRecord?.checkIn || null,
          checkOut: dayRecord?.checkOut || null,
        });
      }

      return NextResponse.json({
        totalEmployees: 1,
        presentToday: todayRecord?.status === 'PRESENT' ? 1 : 0,
        lateToday: todayRecord?.status === 'LATE' ? 1 : 0,
        absentToday: todayRecord ? 0 : 1,
        attendanceRate,
        personalStats: {
          presentDays,
          lateDays,
          totalDays,
        },
        last7Days,
      });
    }
  } catch (error) {
    console.error('Attendance stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance stats' },
      { status: 500 }
    );
  }
}
