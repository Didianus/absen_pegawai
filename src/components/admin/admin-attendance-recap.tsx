'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileDown, FileSpreadsheet, CalendarDays, ChevronLeft, ChevronRight, Users, UserCheck, UserX, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RecapRow {
  id: string
  name: string
  email: string
  position: string
  department: string
  totalDaysInMonth: number
  presentDays: number
  lateDays: number
  absentDays: number
  attendanceRate: number
  details: {
    date: string
    checkIn: string | null
    checkOut: string | null
    status: string
  }[]
}

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function AdminAttendanceRecap() {
  const { toast } = useToast()
  const [recap, setRecap] = useState<RecapRow[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [detailUser, setDetailUser] = useState<RecapRow | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15
  const monthOptions = getMonthOptions()

  const fetchRecap = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth)
      if (selectedDepartment && selectedDepartment !== 'all') {
        params.set('department', selectedDepartment)
      }
      const res = await fetch(`/api/attendance/recap?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecap(data.recap)
        if (data.departments) {
          setDepartments(data.departments)
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedDepartment])

  useEffect(() => {
    fetchRecap()
  }, [fetchRecap])

  useEffect(() => {
    setPage(1)
  }, [selectedMonth, selectedDepartment])

  // Summary stats
  const totalEmployees = recap.length
  const avgAttendanceRate = totalEmployees > 0
    ? Math.round(recap.reduce((sum, r) => sum + r.attendanceRate, 0) / totalEmployees)
    : 0
  const totalPresent = recap.reduce((sum, r) => sum + r.presentDays, 0)
  const totalLate = recap.reduce((sum, r) => sum + r.lateDays, 0)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(recap.length / PAGE_SIZE))
  const paginatedRecap = recap.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Export to PDF
  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Rekapan Kehadiran Karyawan', 148, 15, { align: 'center' })

      // Subtitle - month
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Periode: ${formatMonthLabel(selectedMonth)}`, 148, 22, { align: 'center' })

      if (selectedDepartment !== 'all') {
        doc.setFontSize(10)
        doc.text(`Departemen: ${selectedDepartment}`, 148, 28, { align: 'center' })
      }

      // Summary
      doc.setFontSize(9)
      doc.text(`Total Karyawan: ${totalEmployees} | Rata-rata Kehadiran: ${avgAttendanceRate}% | Total Hadir: ${totalPresent} | Total Terlambat: ${totalLate}`, 148, selectedDepartment !== 'all' ? 34 : 28, { align: 'center' })

      const startY = selectedDepartment !== 'all' ? 40 : 34

      // Table
      const tableData = recap.map((r, idx) => [
        idx + 1,
        r.name,
        r.department || '-',
        r.position || '-',
        String(r.totalDaysInMonth),
        String(r.presentDays),
        String(r.lateDays),
        String(r.absentDays),
        `${r.attendanceRate}%`,
      ])

      autoTable(doc, {
        head: [['No', 'Nama Karyawan', 'Departemen', 'Jabatan', 'Hari Kerja', 'Hadir', 'Terlambat', 'Tidak Hadir', 'Persentase']],
        body: tableData,
        startY,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `AttendEase - Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          148,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        )
        doc.text(`Halaman ${i} dari ${pageCount}`, 287, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
      }

      doc.save(`rekapan-kehadiran-${selectedMonth}.pdf`)
      toast({ title: 'Berhasil', description: 'File PDF berhasil diunduh' })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({ title: 'Gagal', description: 'Gagal mengekspor PDF', variant: 'destructive' })
    }
  }

  // Export to Excel
  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx')

      // Summary sheet
      const summaryData = [
        ['REKAPAN KEHADIRAN KARYAWAN'],
        [`Periode: ${formatMonthLabel(selectedMonth)}`],
        selectedDepartment !== 'all' ? [`Departemen: ${selectedDepartment}`] : [],
        [],
        ['Total Karyawan', totalEmployees],
        ['Rata-rata Kehadiran', `${avgAttendanceRate}%`],
        ['Total Hari Hadir', totalPresent],
        ['Total Hari Terlambat', totalLate],
        [],
      ]

      // Main data
      const headerRow = ['No', 'Nama Karyawan', 'Email', 'Departemen', 'Jabatan', 'Hari Kerja', 'Hadir', 'Terlambat', 'Tidak Hadir', 'Persentase Kehadiran']
      const dataRows = recap.map((r, idx) => [
        idx + 1,
        r.name,
        r.email,
        r.department || '-',
        r.position || '-',
        r.totalDaysInMonth,
        r.presentDays,
        r.lateDays,
        r.absentDays,
        `${r.attendanceRate}%`,
      ])

      const wsData = [...summaryData, headerRow, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama
        { wch: 25 },  // Email
        { wch: 18 },  // Departemen
        { wch: 18 },  // Jabatan
        { wch: 12 },  // Hari Kerja
        { wch: 8 },   // Hadir
        { wch: 12 },  // Terlambat
        { wch: 14 },  // Tidak Hadir
        { wch: 20 },  // Persentase
      ]

      // Detail sheet per employee
      const detailRows: (string | number)[][] = []
      const detailHeader = ['No', 'Nama Karyawan', 'Departemen', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status']
      detailRows.push(detailHeader)

      let detailNo = 1
      for (const r of recap) {
        if (r.details.length > 0) {
          for (const d of r.details) {
            detailRows.push([
              detailNo++,
              r.name,
              r.department || '-',
              d.date,
              d.checkIn || '-',
              d.checkOut || '-',
              d.status === 'PRESENT' ? 'Hadir' : d.status === 'LATE' ? 'Terlambat' : 'Tidak Hadir',
            ])
          }
        }
      }

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows)
      wsDetail['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Rekapan')
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Kehadiran')

      XLSX.writeFile(wb, `rekapan-kehadiran-${selectedMonth}.xlsx`)
      toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' })
    } catch (error) {
      console.error('Excel export error:', error)
      toast({ title: 'Gagal', description: 'Gagal mengekspor Excel', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Rekapan Kehadiran Karyawan</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportPDF}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={loading || recap.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            onClick={exportExcel}
            variant="outline"
            size="sm"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            disabled={loading || recap.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[220px]">
            <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
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

        {departments.length > 0 && (
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Semua departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Karyawan</p>
                <p className="text-xl font-bold text-slate-900">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Rata-rata Kehadiran</p>
                <p className="text-xl font-bold text-slate-900">{avgAttendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Terlambat</p>
                <p className="text-xl font-bold text-slate-900">{totalLate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Hadir</p>
                <p className="text-xl font-bold text-slate-900">{totalPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recap Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Tabel Rekapan - {formatMonthLabel(selectedMonth)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recap.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-sm">Tidak ada data kehadiran untuk bulan ini</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead className="hidden md:table-cell">Departemen</TableHead>
                      <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                      <TableHead className="text-center">Hari Kerja</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Terlambat</TableHead>
                      <TableHead className="text-center">Tidak Hadir</TableHead>
                      <TableHead className="text-center">Persentase</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecap.map((r, idx) => {
                      const rateColor = r.attendanceRate >= 80
                        ? 'text-emerald-700 bg-emerald-50'
                        : r.attendanceRate >= 60
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-red-700 bg-red-50'

                      return (
                        <TableRow key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetailUser(r)}>
                          <TableCell className="text-slate-500">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{r.name}</p>
                              <p className="text-xs text-slate-500">{r.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-600">
                            {r.department || '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-600">
                            {r.position || '-'}
                          </TableCell>
                          <TableCell className="text-center text-slate-700 font-medium">
                            {r.totalDaysInMonth}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              {r.presentDays}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                              {r.lateDays}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                              {r.absentDays}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rateColor}`}>
                              {r.attendanceRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetailUser(r)
                              }}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {recap.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3 mt-4">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, recap.length)} dari {recap.length} karyawan
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
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
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

      {/* Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Detail Kehadiran - {detailUser?.name}
            </DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Email</span>
                  <p className="font-medium text-slate-900">{detailUser.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Departemen</span>
                  <p className="font-medium text-slate-900">{detailUser.department || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Jabatan</span>
                  <p className="font-medium text-slate-900">{detailUser.position || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Persentase Kehadiran</span>
                  <p className="font-medium text-slate-900">{detailUser.attendanceRate}%</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="text-xs text-slate-500">Hari Kerja</p>
                  <p className="text-lg font-bold text-slate-900">{detailUser.totalDaysInMonth}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center">
                  <p className="text-xs text-emerald-600">Hadir</p>
                  <p className="text-lg font-bold text-emerald-700">{detailUser.presentDays}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2 text-center">
                  <p className="text-xs text-amber-600">Terlambat</p>
                  <p className="text-lg font-bold text-amber-700">{detailUser.lateDays}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2 text-center">
                  <p className="text-xs text-red-600">Tidak Hadir</p>
                  <p className="text-lg font-bold text-red-700">{detailUser.absentDays}</p>
                </div>
              </div>

              {/* Daily Detail Table */}
              {detailUser.details.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailUser.details.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-slate-900">{d.date}</TableCell>
                        <TableCell className="text-slate-600">{d.checkIn || '-'}</TableCell>
                        <TableCell className="text-slate-600">{d.checkOut || '-'}</TableCell>
                        <TableCell>
                          {d.status === 'PRESENT' ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              Hadir
                            </Badge>
                          ) : d.status === 'LATE' ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                              Terlambat
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                              Tidak Hadir
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Tidak ada data kehadiran untuk bulan ini
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
