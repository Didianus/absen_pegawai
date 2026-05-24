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
import { FileDown, FileSpreadsheet, CalendarDays, UserCheck, Clock, UserX } from 'lucide-react'
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
  for (let i = 0; i < 12; i++) {
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

export function UserAttendanceRecap() {
  const { toast } = useToast()
  const [recap, setRecap] = useState<RecapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const monthOptions = getMonthOptions()

  const fetchRecap = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('month', selectedMonth)
      const res = await fetch(`/api/attendance/recap?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecap(data.recap)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => {
    fetchRecap()
  }, [fetchRecap])

  const myRecap = recap[0] // User only has their own data
  const details = myRecap?.details || []

  // Export to PDF
  const exportPDF = async () => {
    if (!myRecap) return
    try {
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Rekapan Kehadiran Saya', 105, 15, { align: 'center' })

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Periode: ${formatMonthLabel(selectedMonth)}`, 105, 22, { align: 'center' })

      // Employee info
      doc.setFontSize(10)
      doc.text(`Nama: ${myRecap.name}`, 15, 32)
      doc.text(`Departemen: ${myRecap.department || '-'}`, 15, 38)
      doc.text(`Jabatan: ${myRecap.position || '-'}`, 15, 44)

      // Summary
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan:', 15, 54)
      doc.setFont('helvetica', 'normal')
      doc.text(`Hari Kerja: ${myRecap.totalDaysInMonth}`, 20, 60)
      doc.text(`Hadir: ${myRecap.presentDays}`, 20, 66)
      doc.text(`Terlambat: ${myRecap.lateDays}`, 20, 72)
      doc.text(`Tidak Hadir: ${myRecap.absentDays}`, 20, 78)
      doc.text(`Persentase Kehadiran: ${myRecap.attendanceRate}%`, 20, 84)

      // Detail table
      if (details.length > 0) {
        const tableData = details.map((d, idx) => [
          idx + 1,
          d.date,
          d.checkIn || '-',
          d.checkOut || '-',
          d.status === 'PRESENT' ? 'Hadir' : d.status === 'LATE' ? 'Terlambat' : 'Tidak Hadir',
        ])

        autoTable(doc, {
          head: [['No', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status']],
          body: tableData,
          startY: 92,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 15, right: 15 },
        })
      }

      // Footer
      doc.setFontSize(8)
      doc.text(
        `AttendEase - Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        105,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )

      doc.save(`rekapan-kehadiran-${selectedMonth}.pdf`)
      toast({ title: 'Berhasil', description: 'File PDF berhasil diunduh' })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({ title: 'Gagal', description: 'Gagal mengekspor PDF', variant: 'destructive' })
    }
  }

  // Export to Excel
  const exportExcel = async () => {
    if (!myRecap) return
    try {
      const XLSX = await import('xlsx')

      // Summary sheet
      const summaryData = [
        ['REKAPAN KEHADIRAN SAYA'],
        [`Periode: ${formatMonthLabel(selectedMonth)}`],
        [],
        ['Nama', myRecap.name],
        ['Email', myRecap.email],
        ['Departemen', myRecap.department || '-'],
        ['Jabatan', myRecap.position || '-'],
        [],
        ['Hari Kerja', myRecap.totalDaysInMonth],
        ['Hadir', myRecap.presentDays],
        ['Terlambat', myRecap.lateDays],
        ['Tidak Hadir', myRecap.absentDays],
        ['Persentase Kehadiran', `${myRecap.attendanceRate}%`],
        [],
      ]

      const headerRow = ['No', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status']
      const dataRows = details.map((d, idx) => [
        idx + 1,
        d.date,
        d.checkIn || '-',
        d.checkOut || '-',
        d.status === 'PRESENT' ? 'Hadir' : d.status === 'LATE' ? 'Terlambat' : 'Tidak Hadir',
      ])

      const wsData = [...summaryData, headerRow, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      ws['!cols'] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Rekapan Kehadiran')

      XLSX.writeFile(wb, `rekapan-kehadiran-${selectedMonth}.xlsx`)
      toast({ title: 'Berhasil', description: 'File Excel berhasil diunduh' })
    } catch (error) {
      console.error('Excel export error:', error)
      toast({ title: 'Gagal', description: 'Gagal mengekspor Excel', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Rekapan Kehadiran Saya
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
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
            <Button
              onClick={exportPDF}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              disabled={loading || !myRecap}
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={exportExcel}
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              disabled={loading || !myRecap}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !myRecap ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CalendarDays className="h-12 w-12 mb-3 text-slate-300" />
              <p className="text-sm">Tidak ada data kehadiran untuk bulan ini</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                <div className="rounded-lg bg-slate-50 p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-500">Hari Kerja</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{myRecap.totalDaysInMonth}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-emerald-600">Hadir</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{myRecap.presentDays}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-amber-600">Terlambat</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">{myRecap.lateDays}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <UserX className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-red-600">Tidak Hadir</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{myRecap.absentDays}</p>
                </div>
              </div>

              {/* Attendance rate bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">Persentase Kehadiran</span>
                  <span className={`text-sm font-bold ${
                    myRecap.attendanceRate >= 80 ? 'text-emerald-600' : myRecap.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {myRecap.attendanceRate}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      myRecap.attendanceRate >= 80 ? 'bg-emerald-500' : myRecap.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${myRecap.attendanceRate}%` }}
                  />
                </div>
              </div>

              {/* Daily Detail Table */}
              {details.length > 0 ? (
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
                    {details.map((d, idx) => (
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
                  Tidak ada catatan kehadiran untuk bulan ini
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
