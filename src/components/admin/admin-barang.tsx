'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BarangItem {
  id: string
  kode: string
  nama: string
  kategori: string
  satuan: string
  stok: number
  deskripsi: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  kode: string
  nama: string
  kategori: string
  satuan: string
  stok: number
  deskripsi: string
}

const emptyForm: FormData = {
  kode: '',
  nama: '',
  kategori: '',
  satuan: 'pcs',
  stok: 0,
  deskripsi: '',
}

const PAGE_SIZE = 15

export function AdminBarang() {
  const { toast } = useToast()
  const [items, setItems] = useState<BarangItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<BarangItem | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/barang')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = items.filter((item) => {
    const q = search.toLowerCase()
    return (
      item.nama.toLowerCase().includes(q) ||
      item.kode.toLowerCase().includes(q) ||
      item.kategori.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleAdd = () => {
    setForm(emptyForm)
    setFormError(null)
    setAddOpen(true)
  }

  const handleEdit = (item: BarangItem) => {
    setSelected(item)
    setForm({
      kode: item.kode,
      nama: item.nama,
      kategori: item.kategori,
      satuan: item.satuan,
      stok: item.stok,
      deskripsi: item.deskripsi,
    })
    setFormError(null)
    setEditOpen(true)
  }

  const handleDeleteConfirm = (item: BarangItem) => {
    setSelected(item)
    setDeleteOpen(true)
  }

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.kode.trim() || !form.nama.trim()) {
      setFormError('Kode dan nama barang wajib diisi')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Gagal menambahkan barang')
        return
      }
      setAddOpen(false)
      await fetchItems()
      toast({ title: 'Berhasil', description: 'Barang berhasil ditambahkan' })
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!form.kode.trim() || !form.nama.trim()) {
      setFormError('Kode dan nama barang wajib diisi')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch(`/api/barang/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Gagal memperbarui barang')
        return
      }
      setEditOpen(false)
      await fetchItems()
      toast({ title: 'Berhasil', description: 'Data barang berhasil diperbarui' })
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const submitDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/barang/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: 'Gagal', description: data.error || 'Gagal menghapus barang', variant: 'destructive' })
        return
      }
      setDeleteOpen(false)
      await fetchItems()
      toast({ title: 'Berhasil', description: 'Barang berhasil dihapus' })
    } catch {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan jaringan', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Manajemen Barang</h1>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Barang
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari barang..."
          className="pl-9"
        />
      </div>

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
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-slate-300" />
                            {search ? 'Tidak ada barang yang cocok' : 'Belum ada data barang'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-slate-500">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.kode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{item.nama}</p>
                              {item.deskripsi && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.deskripsi}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-600">
                            {item.kategori || '-'}
                          </TableCell>
                          <TableCell className="text-slate-600">{item.satuan || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.stok <= 0
                                  ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
                                  : item.stok <= 10
                                  ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }
                            >
                              {item.stok}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDeleteConfirm(item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} barang
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
            <DialogTitle>Tambah Barang Baru</DialogTitle>
            <DialogDescription>Isi data berikut untuk menambahkan barang baru.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdd} className="grid gap-4 py-2">
            {formError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="add-kode">Kode Barang</Label>
                <Input id="add-kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="BRG001" autoFocus required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-nama">Nama Barang</Label>
                <Input id="add-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama barang" required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="add-kategori">Kategori</Label>
                <Input id="add-kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Elektronik, ATK, dll." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-satuan">Satuan</Label>
                <Input id="add-satuan" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} placeholder="pcs, kg, box, dll." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-stok">Stok Awal</Label>
              <Input id="add-stok" type="number" min="0" value={form.stok} onChange={(e) => setForm({ ...form, stok: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-deskripsi">Deskripsi</Label>
              <Input id="add-deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="Deskripsi singkat (opsional)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
            <DialogDescription>Perbarui data barang berikut.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="grid gap-4 py-2">
            {formError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-kode">Kode Barang</Label>
                <Input id="edit-kode" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} autoFocus required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-nama">Nama Barang</Label>
                <Input id="edit-nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-kategori">Kategori</Label>
                <Input id="edit-kategori" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-satuan">Satuan</Label>
                <Input id="edit-satuan" value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-stok">Stok</Label>
              <Input id="edit-stok" type="number" min="0" value={form.stok} onChange={(e) => setForm({ ...form, stok: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-deskripsi">Deskripsi</Label>
              <Input id="edit-deskripsi" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Batal</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Perbarui'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Barang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus barang <strong>{selected?.nama}</strong> ({selected?.kode})?
              Semua riwayat barang masuk dan keluar untuk item ini juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
