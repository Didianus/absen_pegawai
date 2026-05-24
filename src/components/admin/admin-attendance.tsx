'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ChevronLeft, ChevronRight, Search, CalendarIcon } from 'lucide-react'
import { format, parse } from 'date-fns'

interface AttendanceRecord {
  id: string
  userId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  note: string | null
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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  PRESENT: {
    label: 'Hadir',
    variant: 'secondary',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  LATE: {
    label: 'Terlambat',
    variant: 'secondary',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  ABSENT: {
    label: 'Tidak Hadir',
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
  },
}

export function AdminAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [page, setPage] = useState(1)

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (dateFilter) {
        params.set('date', format(dateFilter, 'yyyy-MM-dd'))
      }
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
  }, [page, dateFilter])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  // Filter records by search (client-side for name matching)
  const filtered = search
    ? records.filter((r) =>
        r.user.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email.toLowerCase().includes(search.toLowerCase()) ||
        (r.user.department ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : records

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] ?? statusConfig.ABSENT
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parsed = parse(dateStr, 'yyyy-MM-dd', new Date())
      return format(parsed, 'dd MMM yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Data Kehadiran</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari karyawan..."
            className="pl-9"
          />
        </div>

        {/* Date picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'Pilih tanggal'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                setDateFilter(date)
                setCalendarOpen(false)
                setPage(1)
              }}
              initialFocus
            />
            {dateFilter && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setDateFilter(undefined)
                    setCalendarOpen(false)
                    setPage(1)
                  }}
                >
                  Hapus filter tanggal
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                          Tidak ada data kehadiran
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-slate-500">
                            {(page - 1) * 20 + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{r.user.name}</p>
                              <p className="text-xs text-slate-500">{r.user.department || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {formatDateDisplay(r.date)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {r.checkIn || '-'}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {r.checkOut || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="hidden md:table-cell text-slate-500">
                            {r.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
                    {pagination.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 px-2">
                      {page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
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
    </div>
  )
}
