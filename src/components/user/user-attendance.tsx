'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Camera } from 'lucide-react'
import { motion } from 'framer-motion'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  checkInPhoto: string | null
  checkOutPhoto: string | null
  checkInLat: string | null
  checkInLng: string | null
  checkOutLat: string | null
  checkOutLng: string | null
  user: {
    name: string
    email: string
    position: string | null
    department: string | null
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function calculateDuration(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return '-'
  const [inH, inM] = checkIn.split(':').map(Number)
  const [outH, outM] = checkOut.split(':').map(Number)
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM)
  if (totalMinutes < 0) return '-'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} jam ${minutes} menit`
}

function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export function UserAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [page, setPage] = useState(1)
  const [viewPhoto, setViewPhoto] = useState<{ url: string; lat: string; lng: string; label: string } | null>(null)
  const monthOptions = getMonthOptions()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth)
      params.set('page', String(page))
      params.set('limit', '10')
      const res = await fetch(`/api/attendance?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records)
        setPagination(data.pagination)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
    setPage(1)
  }

  const hasAnyPhoto = (record: AttendanceRecord) => {
    return !!(record.checkInPhoto || record.checkOutPhoto)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Riwayat Kehadiran
          </CardTitle>
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-sm">Tidak ada data kehadiran untuk bulan ini</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Durasi Kerja</TableHead>
                      <TableHead className="hidden md:table-cell">Dokumentasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-slate-500">
                          {(page - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {formatDateDisplay(record.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span>{record.checkIn || '-'}</span>
                            {record.checkInPhoto && (
                              <button
                                type="button"
                                onClick={() => setViewPhoto({
                                  url: record.checkInPhoto!,
                                  lat: record.checkInLat || '',
                                  lng: record.checkInLng || '',
                                  label: `Check-In - ${formatDateDisplay(record.date)}`,
                                })}
                                className="shrink-0"
                              >
                                <img
                                  src={record.checkInPhoto}
                                  alt="Foto masuk"
                                  className="h-6 w-6 rounded object-cover border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </button>
                            )}
                          </div>
                          {record.checkInLat && record.checkInLng && (
                            <div className="flex items-center gap-0.5 text-[10px] text-slate-400 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>{record.checkInLat}, {record.checkInLng}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span>{record.checkOut || '-'}</span>
                            {record.checkOutPhoto && (
                              <button
                                type="button"
                                onClick={() => setViewPhoto({
                                  url: record.checkOutPhoto!,
                                  lat: record.checkOutLat || '',
                                  lng: record.checkOutLng || '',
                                  label: `Check-Out - ${formatDateDisplay(record.date)}`,
                                })}
                                className="shrink-0"
                              >
                                <img
                                  src={record.checkOutPhoto}
                                  alt="Foto keluar"
                                  className="h-6 w-6 rounded object-cover border border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </button>
                            )}
                          </div>
                          {record.checkOutLat && record.checkOutLng && (
                            <div className="flex items-center gap-0.5 text-[10px] text-slate-400 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>{record.checkOutLat}, {record.checkOutLng}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === 'PRESENT' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                              Hadir
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                              Terlambat
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {calculateDuration(record.checkIn, record.checkOut)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {hasAnyPhoto(record) ? (
                            <div className="flex items-center gap-1">
                              {record.checkInPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewPhoto({
                                    url: record.checkInPhoto!,
                                    lat: record.checkInLat || '',
                                    lng: record.checkInLng || '',
                                    label: `Check-In - ${formatDateDisplay(record.date)}`,
                                  })}
                                >
                                  <img
                                    src={record.checkInPhoto}
                                    alt="Foto masuk"
                                    className="h-8 w-8 rounded object-cover border border-emerald-200 hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </button>
                              )}
                              {record.checkOutPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setViewPhoto({
                                    url: record.checkOutPhoto!,
                                    lat: record.checkOutLat || '',
                                    lng: record.checkOutLng || '',
                                    label: `Check-Out - ${formatDateDisplay(record.date)}`,
                                  })}
                                >
                                  <img
                                    src={record.checkOutPhoto}
                                    alt="Foto keluar"
                                    className="h-8 w-8 rounded object-cover border border-amber-200 hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Tidak ada</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 sm:hidden">
                {records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">
                        {formatDateDisplay(record.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        {hasAnyPhoto(record) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const photo = record.checkInPhoto || record.checkOutPhoto
                              if (photo) {
                                setViewPhoto({
                                  url: photo,
                                  lat: record.checkInLat || record.checkOutLat || '',
                                  lng: record.checkInLng || record.checkOutLng || '',
                                  label: `Dokumentasi - ${formatDateDisplay(record.date)}`,
                                })
                              }
                            }}
                          >
                            <Camera className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        )}
                        {record.status === 'PRESENT' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            Hadir
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                            Terlambat
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">Masuk</span>
                        <p className="font-medium text-slate-700">{record.checkIn || '-'}</p>
                        {record.checkInLat && record.checkInLng && (
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <MapPin className="h-2.5 w-2.5" />
                            {record.checkInLat}, {record.checkInLng}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400">Keluar</span>
                        <p className="font-medium text-slate-700">{record.checkOut || '-'}</p>
                        {record.checkOutLat && record.checkOutLng && (
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                            <MapPin className="h-2.5 w-2.5" />
                            {record.checkOutLat}, {record.checkOutLng}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Durasi</span>
                        <p className="font-medium text-slate-700">
                          {calculateDuration(record.checkIn, record.checkOut)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(page - 1) * 10 + 1}-{Math.min(page * 10, pagination.total)} dari {pagination.total} data
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                      {page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
}
