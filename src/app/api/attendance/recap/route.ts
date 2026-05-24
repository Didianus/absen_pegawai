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
    const month = searchParams.get('month'); // YYYY-MM format
    const department = searchParams.get('department');

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required (YYYY-MM)' }, { status: 400 });
    }

    // Get all users (admin sees all, user sees only self)
    const userWhere: { role?: string; department?: string } = {};
    if (user.role !== 'ADMIN') {
      // For regular users, only return their own recap
      const userData = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          department: true,
          role: true,
        },
      });

      if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get attendance records for this user for the specified month
      const attendances = await db.attendance.findMany({
        where: {
          userId: user.id,
          date: { startsWith: month },
        },
        orderBy: { date: 'asc' },
      });

      const totalDaysInMonth = getWorkingDaysInMonth(month);
      const presentDays = attendances.filter((a) => a.status === 'PRESENT').length;
      const lateDays = attendances.filter((a) => a.status === 'LATE').length;
      const absentDays = totalDaysInMonth - attendances.length;
      const attendanceRate = totalDaysInMonth > 0
        ? Math.round(((presentDays + lateDays) / totalDaysInMonth) * 100)
        : 0;

      return NextResponse.json({
        recap: [{
          id: userData.id,
          name: userData.name,
          email: userData.email,
          position: userData.position,
          department: userData.department,
          totalDaysInMonth,
          presentDays,
          lateDays,
          absentDays,
          attendanceRate,
          details: attendances.map((a) => ({
            date: a.date,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            status: a.status,
          })),
        }],
        month,
      });
    }

    // Admin view: get all users or filter by department
    if (department) {
      userWhere.department = department;
    }

    const users = await db.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get all attendance records for the month
    const attendances = await db.attendance.findMany({
      where: {
        date: { startsWith: month },
        ...(department ? {
          user: { department },
        } : {}),
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    // Group attendances by userId
    const attendanceByUser = new Map<string, typeof attendances>();
    for (const att of attendances) {
      const list = attendanceByUser.get(att.userId) || [];
      list.push(att);
      attendanceByUser.set(att.userId, list);
    }

    const totalDaysInMonth = getWorkingDaysInMonth(month);

    const recap = users.map((u) => {
      const userAttendances = attendanceByUser.get(u.id) || [];
      const presentDays = userAttendances.filter((a) => a.status === 'PRESENT').length;
      const lateDays = userAttendances.filter((a) => a.status === 'LATE').length;
      const absentDays = totalDaysInMonth - userAttendances.length;
      const attendanceRate = totalDaysInMonth > 0
        ? Math.round(((presentDays + lateDays) / totalDaysInMonth) * 100)
        : 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        position: u.position,
        department: u.department,
        totalDaysInMonth,
        presentDays,
        lateDays,
        absentDays,
        attendanceRate,
        details: userAttendances.map((a) => ({
          date: a.date,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          status: a.status,
        })),
      };
    });

    // Get unique departments for filter
    const allDepartments = await db.user.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: '' } },
    });

    return NextResponse.json({
      recap,
      month,
      departments: allDepartments.map((d) => d.department),
    });
  } catch (error) {
    console.error('Attendance recap error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance recap' },
      { status: 500 }
    );
  }
}

// Calculate working days in a month (Mon-Fri)
function getWorkingDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const now = new Date();

  // If the month is the current month or future, cap at today
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const lastDay = isCurrentMonth
    ? now.getDate()
    : new Date(year, month, 0).getDate(); // Last day of month

  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    date.setDate(day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
  }
  return workingDays;
}
