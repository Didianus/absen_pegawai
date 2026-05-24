'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore, type User } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface UserRow extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt?: string
  updatedAt?: string
  attendanceCount?: number
}

interface FormData {
  name: string
  email: string
  password: string
  role: string
  position: string
  department: string
  phone: string
}

const emptyForm: FormData = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
  position: '',
  department: '',
  phone: '',
}

const PAGE_SIZE = 10

export function AdminUsers() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users by search
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.position ?? '').toLowerCase().includes(q) ||
      (u.department ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  const handleAdd = () => {
    setForm(emptyForm)
    setFormError(null)
    setAddOpen(true)
  }

  const handleEdit = (u: UserRow) => {
    setSelectedUser(u)
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      position: u.position ?? '',
      department: u.department ?? '',
      phone: u.phone ?? '',
    })
    setFormError(null)
    setEditOpen(true)
  }

  const handleDeleteConfirm = (u: UserRow) => {
    setSelectedUser(u)
    setDeleteOpen(true)
  }

  const submitAdd = async () => {
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Gagal menambahkan pengguna')
        return
      }
      setAddOpen(false)
      await fetchUsers()
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    setFormError(null)
    try {
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
        position: form.position,
        department: form.department,
        phone: form.phone,
      }
      if (form.password) {
        body.password = form.password
      }
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Gagal memperbarui pengguna')
        return
      }
      setEditOpen(false)
      await fetchUsers()
    } catch {
      setFormError('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal menghapus pengguna')
        return
      }
      setDeleteOpen(false)
      await fetchUsers()
    } catch {
      alert('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  const UserForm = ({ mode }: { mode: 'add' | 'edit' }) => (
    <div className="grid gap-4 py-2">
      {formError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-name`}>Nama</Label>
        <Input
          id={`${mode}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama lengkap"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@contoh.com"
        />
      </div>
      {mode === 'add' && (
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          <Input
            id={`${mode}-password`}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimal 6 karakter"
          />
        </div>
      )}
      {mode === 'edit' && (
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-password`}>Password Baru (opsional)</Label>
          <Input
            id={`${mode}-password`}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Kosongkan jika tidak ingin mengubah"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-role`}>Role</Label>
        <Select
          value={form.role}
          onValueChange={(value) => setForm({ ...form, role: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-position`}>Jabatan</Label>
          <Input
            id={`${mode}-position`}
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Jabatan"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-department`}>Departemen</Label>
          <Input
            id={`${mode}-department`}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Departemen"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-phone`}>No. Telepon</Label>
        <Input
          id={`${mode}-phone`}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="08xxxxxxxxxx"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Manajemen Pengguna</h1>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pengguna..."
          className="pl-9"
        />
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
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                      <TableHead className="hidden lg:table-cell">Departemen</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                          {search ? 'Tidak ada pengguna yang cocok' : 'Belum ada data pengguna'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((u, idx) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-slate-500">
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                          <TableCell className="text-slate-600">{u.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-slate-600">
                            {u.position || '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-600">
                            {u.department || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                onClick={() => handleEdit(u)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              {currentUser?.id !== u.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-red-600"
                                  onClick={() => handleDeleteConfirm(u)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Hapus</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Menampilkan {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} pengguna
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Isi data berikut untuk menambahkan pengguna baru.
            </DialogDescription>
          </DialogHeader>
          <UserForm mode="add" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={submitAdd} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna berikut.
            </DialogDescription>
          </DialogHeader>
          <UserForm mode="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={submitEdit} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna{' '}
              <strong>{selectedUser?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan dan semua data kehadiran pengguna ini juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {submitting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
