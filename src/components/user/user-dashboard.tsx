'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Clock, LogIn, LogOut, CheckCircle, CalendarDays, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { CameraCapture, type CaptureData } from '@/components/attendance/camera-capture'

interface TodayAttendance {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  checkInPhoto: string
  checkOutPhoto: string
  checkInLat: string
  checkInLng: string
  checkOutLat: string
  checkOutLng: string
}

interface PersonalStats {
  presentDays: number
  lateDays: number
  totalDays: number
}

interface StatsResponse {
  personalStats: PersonalStats
  attendanceRate: number
  presentToday: number
  lateToday: number
}

export function UserDashboard() {
  const { user } = useAuthStore()
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Camera dialog state
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'checkin' | 'checkout'>('checkin')
  const [pendingCapture, setPendingCapture] = useState<CaptureData | null>(null)

  // Photo preview dialog state
  const [viewPhoto, setViewPhoto] = useState<{ url: string; lat: string; lng: string; label: string } | null>(null)

  // Live clock with Bangkok timezone
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const bangkokOffset = 7 * 60
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const bangkok = new Date(utc + bangkokOffset * 60000)
      setCurrentTime(bangkok.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCurrentDate(bangkok.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        setTodayRecord(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchTodayAttendance(), fetchStats()])
      } catch {
        setError('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [fetchTodayAttendance, fetchStats])

  const handleCheckInClick = () => {
    setCameraMode('checkin')
    setShowCamera(true)
  }

  const handleCheckOutClick = () => {
    setCameraMode('checkout')
    setShowCamera(true)
  }

  const handleCameraCapture = useCallback(
    async (capture: CaptureData) => {
      setPendingCapture(capture)
      setShowCamera(false)
      setActionLoading(true)
      setError(null)

      try {
        let res: Response
        if (cameraMode === 'checkin') {
          res = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photo: capture.photo,
              latitude: capture.latitude,
              longitude: capture.longitude,
            }),
          })
        } else {
          res = await fetch('/api/attendance/check-out', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photo: capture.photo,
              latitude: capture.latitude,
              longitude: capture.longitude,
            }),
          })
        }

        const data = await res.json()
        if (res.ok) {
          setTodayRecord(data)
          await fetchStats()
        } else {
          setError(data.error || 'Gagal melakukan operasi')
        }
      } catch {
        setError('Terjadi kesalahan jaringan')
      } finally {
        setActionLoading(false)
        setPendingCapture(null)
      }
    },
    [cameraMode, fetchStats]
  )

  const handleCameraCancel = useCallback(() => {
    setShowCamera(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {error}
        </motion.div>
      )}

      {/* Welcome Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {getGreeting()}, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="mt-1 text-sm text-slate-600">{currentDate}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-3 shadow-sm border border-emerald-100">
              <Clock className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {currentTime}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in / Check-out Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {!todayRecord ? (
            /* Not checked in yet */
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-full bg-emerald-50 p-4">
                <LogIn className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Anda belum melakukan check-in hari ini</p>
                <p className="text-xs text-slate-400">Check-in sebelum pukul 09:00 untuk dianggap hadir tepat waktu</p>
              </div>
              <Button
                size="lg"
                onClick={handleCheckInClick}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-emerald-200"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-1" />
                    Check In
                  </>
                )}
              </Button>
            </div>
          ) : !todayRecord.checkOut ? (
            /* Checked in but not checked out */
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
                  <LogIn className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Masuk: {todayRecord.checkIn}</span>
                  {todayRecord.checkInPhoto && (
                    <button
                      type="button"
                      onClick={() =>
                        setViewPhoto({
                          url: todayRecord.checkInPhoto,
                          lat: todayRecord.checkInLat,
                          lng: todayRecord.checkInLng,
                          label: 'Check-In',
                        })
                      }
                      className="ml-1 shrink-0"
                    >
                      <img
                        src={todayRecord.checkInPhoto}
                        alt="Foto check-in"
                        className="h-6 w-6 rounded-full object-cover border border-emerald-200 hover:opacity-80 transition-opacity"
                      />
                    </button>
                  )}
                </div>
                {todayRecord.status === 'LATE' && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                    Terlambat
                  </Badge>
                )}
                {todayRecord.status === 'PRESENT' && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                    Hadir
                  </Badge>
                )}
              </div>
              {todayRecord.checkInLat && todayRecord.checkInLng && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  <span>{todayRecord.checkInLat}, {todayRecord.checkInLng}</span>
                </div>
              )}
              <p className="text-sm text-slate-500">Anda sudah check-in. Jangan lupa check-out sebelum pulang.</p>
              <Button
                size="lg"
                onClick={handleCheckOutClick}
                disabled={actionLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-amber-200"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <LogOut className="h-5 w-5 mr-1" />
                    Check Out
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Both checked in and checked out - Selesai */
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="rounded-full bg-emerald-50 p-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
                  <LogIn className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Masuk: {todayRecord.checkIn}</span>
                  {todayRecord.checkInPhoto && (
                    <button
                      type="button"
                      onClick={() =>
                        setViewPhoto({
                          url: todayRecord.checkInPhoto,
                          lat: todayRecord.checkInLat,
                          lng: todayRecord.checkInLng,
                          label: 'Check-In',
                        })
                      }
                      className="ml-1 shrink-0"
                    >
                      <img
                        src={todayRecord.checkInPhoto}
                        alt="Foto check-in"
                        className="h-8 w-8 rounded object-cover border border-emerald-200 hover:opacity-80 transition-opacity"
                      />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                  <LogOut className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-700">Keluar: {todayRecord.checkOut}</span>
                  {todayRecord.checkOutPhoto && (
                    <button
                      type="button"
                      onClick={() =>
                        setViewPhoto({
                          url: todayRecord.checkOutPhoto,
                          lat: todayRecord.checkOutLat,
                          lng: todayRecord.checkOutLng,
                          label: 'Check-Out',
                        })
                      }
                      className="ml-1 shrink-0"
                    >
                      <img
                        src={todayRecord.checkOutPhoto}
                        alt="Foto check-out"
                        className="h-8 w-8 rounded object-cover border border-amber-200 hover:opacity-80 transition-opacity"
                      />
                    </button>
                  )}
                </div>
              </div>
              {/* GPS coordinates for both */}
              {(todayRecord.checkInLat || todayRecord.checkOutLat) && (
                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400">
                  {todayRecord.checkInLat && todayRecord.checkInLng && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      <span>Masuk: {todayRecord.checkInLat}, {todayRecord.checkInLng}</span>
                    </div>
                  )}
                  {todayRecord.checkOutLat && todayRecord.checkOutLng && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-500" />
                      <span>Keluar: {todayRecord.checkOutLat}, {todayRecord.checkOutLng}</span>
                    </div>
                  )}
                </div>
              )}
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-3 py-1 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Selesai
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Hadir Bulan Ini</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {stats?.personalStats?.presentDays ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">hari</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Terlambat</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {stats?.personalStats?.lateDays ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">hari</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Persentase Kehadiran</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {stats?.attendanceRate ?? 0}%
                </p>
                <p className="mt-0.5 text-xs text-slate-400">dari {stats?.personalStats?.totalDays ?? 0} hari</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <TrendingUp className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Capture Dialog */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] p-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {cameraMode === 'checkin' ? 'Dokumentasi Check-In' : 'Dokumentasi Check-Out'}
            </DialogTitle>
            <DialogDescription>
              Ambil foto dan verifikasi lokasi Anda
            </DialogDescription>
          </DialogHeader>
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={handleCameraCancel}
            loading={actionLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!viewPhoto} onOpenChange={(open) => { if (!open) setViewPhoto(null) }}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] p-4">
          <DialogHeader>
            <DialogTitle>Dokumentasi {viewPhoto?.label}</DialogTitle>
            <DialogDescription>
              Foto dan lokasi saat {viewPhoto?.label?.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          {viewPhoto && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                <img
                  src={viewPhoto.url}
                  alt={`Foto ${viewPhoto.label?.toLowerCase()}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {viewPhoto.lat && viewPhoto.lng && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>{viewPhoto.lat}, {viewPhoto.lng}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function getGreeting() {
    const now = new Date()
    const bangkokOffset = 7 * 60
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const bangkok = new Date(utc + bangkokOffset * 60000)
    const hour = bangkok.getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }
}
