import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('attendance_session');
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export function getBangkokNow(): Date {
  const now = new Date();
  const bangkokOffset = 7 * 60; // UTC+7 in minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + bangkokOffset * 60000);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // HH:mm
}
