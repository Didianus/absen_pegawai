'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore, type User as UserType } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Mail, Briefcase, Phone, Lock, Pencil, Save, X, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  department: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

export function UserProfile() {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editPhone, setEditPhone] = useState('')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setEditName(data.name || '')
        setEditPosition(data.position || '')
        setEditDepartment(data.department || '')
        setEditPhone(data.phone || '')
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          position: editPosition,
          department: editDepartment,
          phone: editPhone,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data)
        setEditMode(false)
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui' })
        // Update auth store
        const updatedUser: UserType = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          position: data.position,
          department: data.department,
          phone: data.phone,
        }
        setUser(updatedUser)
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memperbarui profil' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setMessage(null)
    if (profile) {
      setEditName(profile.name || '')
      setEditPosition(profile.position || '')
      setEditDepartment(profile.department || '')
      setEditPhone(profile.phone || '')
    }
  }

  const handleChangePassword = async () => {
    setPasswordMessage(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Semua kolom kata sandi harus diisi' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru tidak cocok' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter' })
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diubah' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Gagal mengubah kata sandi' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Terjadi kesalahan jaringan' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const formatRole = (role: string) => {
    return role === 'ADMIN' ? 'Administrator' : 'Karyawan'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <User className="h-5 w-5 text-emerald-600" />
            Informasi Profil
          </CardTitle>
          {!editMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-1.5" />
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {/* Success/Error Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 rounded-lg p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {!editMode ? (
            /* Display Mode */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 mt-0.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nama</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{profile?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 mt-0.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{profile?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-50 p-2.5 mt-0.5">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Jabatan</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{profile?.position || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-emerald-50 p-2.5 mt-0.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Departemen</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{profile?.department || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 mt-0.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Telepon</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{profile?.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 mt-0.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Peran</p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5">{formatRole(profile?.role || '')}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nama</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="pl-9"
                      placeholder="Nama lengkap"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Jabatan</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      className="pl-9"
                      placeholder="Jabatan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Departemen</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="pl-9"
                      placeholder="Departemen"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Telepon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="pl-9"
                      placeholder="Nomor telepon"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lock className="h-5 w-5 text-emerald-600" />
            Ubah Kata Sandi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {passwordMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 rounded-lg p-3 text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {passwordMessage.text}
            </motion.div>
          )}

          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kata Sandi Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Masukkan kata sandi saat ini"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Konfirmasi Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Konfirmasi kata sandi baru"
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={passwordSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
            >
              {passwordSaving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Ubah Kata Sandi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
