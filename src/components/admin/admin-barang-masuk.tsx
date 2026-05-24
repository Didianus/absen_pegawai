'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, Search, ChevronLeft, ChevronRight, CalendarIcon, ArrowDownCircle, TrendingUp } from 'lucide-react'
import { format, parse } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface BarangOption {
  id: string
  kode: string
  nama: string
  satuan: string
  stok: number
}

interface BarangMasukRecord {
  id: string
  barangId: string
  jumlah: number
  tanggal: string
  keterangan: string
  penerimaId: string
  createdAt: string
  updatedAt: string
  barang: { id: string; kode: string; nama: string; satuan: string }
  penerima: { id: string; name: string }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function AdminBarangMasuk() {
  const { toast } = useToast()
  const [records, setRecords] = useState<BarangMasukRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [barangList, setBarangList] = useState<BarangOption[]>([])
  const [formBarangId, setFormBarangId] = useState('')
  const [formJumlah, setFormJumlah] = useState('')
  const [formTanggal, setFormTanggal] = useState('')
  const [formKeterangan, setFormKeterangan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Stats
  const [totalMasuk, setTotalMasuk] = useState(0)
  const [totalItemMasuk, setTotalItemMasuk] = useState(0)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (dateFilter) {
        params.set('date', format(dateFilter, 'yyyy-MM-dd'))
      }
      const res = await fetch(`/api/barang-masuk?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records)
        setPagination(data.pagination)
        // Calculate stats
        const allRecords = data.records as BarangMasukRecord[]
        setTotalMasuk(allRecords.reduce((sum, r) => sum + r.jumlah, 0))
        setTotalItemMasuk(allRecords.length)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, dateFilter])

  const fetchBarangList = useCallback(async () => {
    try {
      const res = await fetch('/api/barang')
      if (res.ok) {
        const data = await res.json()
        setBarangList(data.items)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleAddOpen = () => {
    setFormBarangId('')
    setFormJumlah('')
    setFormTanggal(format(new Date(), 'yyyy-MM-dd'))
    setFormKeterangan('')
    setFormError(null)
    fetchBarangList()
    setAddOpen(true)
  }

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!formBarangId) {
      setFormError('Pilih barang terlebih dahulu')
      return
    }
    if (!formJumlah || parseInt(formJumlah) <= 0) {
      setFormError('Jumlah harus lebih dari 0')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/barang-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barangId: formBarangId,
          jumlah: parseInt(formJumlah),
          tanggal: formTanggal,
          keterangan: formKeterangan,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Gagal menambahkan data')
        return
      }
      setAddOpen(false)
      await fetchRecords()
      toast({ title: 'Berhasil', description: 'Barang masuk berhasil dicatat' })
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parsed = parse(dateStr, 'yyyy-MM-dd', new Date())
      return format(parsed, 'dd MMM yyyy')
    } catch {
      return dateStr
    }
  }

  const filtered = search
    ? records.filter((r) =>
        r.barang.nama.toLowerCase().includes(search.toLowerCase()) ||
        r.barang.kode.toLowerCase().includes(search.toLowerCase()) ||
        r.penerima.name.toLowerCase().includes(search.toLowerCase())
      )
    : records

  const selectedBarang = barangList.find((b) => b.id === formBarangId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Laporan Barang Masuk</h1>
        <Button onClick={handleAddOpen} className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Catat Barang Masuk
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Barang Masuk</p>
                <p className="text-2xl font-bold text-slate-900">{totalMasuk}</p>
                <p className="text-xs text-slate-400">unit dari {totalItemMasuk} transaksi</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <ArrowDownCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Transaksi</p>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
                <p className="text-xs text-slate-400">catat barang masuk</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3">
                <TrendingUp className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari barang atau penerima..."
            className="pl-9"
          />
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'Filter tanggal'}
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
                <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateFilter(undefined); setCalendarOpen(false); setPage(1) }}>
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
              {Array.from({ length: 5 }).map((_, i) => (
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
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead className="hidden md:table-cell">Penerima</TableHead>
                      <TableHead className="hidden lg:table-cell">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                          Tidak ada data barang masuk
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((r, idx) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-slate-500">
                            {(pagination.page - 1) * 20 + idx + 1}
                          </TableCell>
                          <TableCell className="text-slate-600">{formatDateDisplay(r.tanggal)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{r.barang.nama}</p>
                              <p className="text-xs text-slate-400">{r.barang.kode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                              +{r.jumlah} {r.barang.satuan}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-600">{r.penerima.name}</TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-500">
                            {r.keterangan || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 px-2">{page} / {pagination.totalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Barang Masuk</DialogTitle>
            <DialogDescription>Tambahkan catatan barang yang masuk ke inventaris.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdd} className="grid gap-4 py-2">
            {formError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formError}</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="bm-barang">Pilih Barang</Label>
              <Select value={formBarangId} onValueChange={setFormBarangId}>
                <SelectTrigger id="bm-barang">
                  <SelectValue placeholder="Pilih barang..." />
                </SelectTrigger>
                <SelectContent>
                  {barangList.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.kode} - {b.nama} (Stok: {b.stok} {b.satuan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBarang && (
                <p className="text-xs text-slate-400">
                  Stok saat ini: <span className="font-medium text-slate-600">{selectedBarang.stok} {selectedBarang.satuan}</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="bm-jumlah">Jumlah</Label>
                <Input id="bm-jumlah" type="number" min="1" value={formJumlah} onChange={(e) => setFormJumlah(e.target.value)} placeholder="0" autoFocus required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bm-tanggal">Tanggal</Label>
                <Input id="bm-tanggal" type="date" value={formTanggal} onChange={(e) => setFormTanggal(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bm-keterangan">Keterangan</Label>
              <Input id="bm-keterangan" value={formKeterangan} onChange={(e) => setFormKeterangan(e.target.value)} placeholder="Alasan/keterangan barang masuk (opsional)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
