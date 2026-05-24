import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('attendance_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse session data from cookie
    let sessionData: { id: string; name: string; email: string; role: string };
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Verify user still exists in database
    const user = await db.user.findUnique({
      where: { id: sessionData.id },
    });

    if (!user) {
      // User no longer exists, clear the cookie
      cookieStore.delete('attendance_session');
      return NextResponse.json(
        { error: 'User no longer exists' },
        { status: 401 }
      );
    }

    // Return current user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
