import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  role: string
  position?: string
  department?: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  view: 'login' | 'register' | 'admin-dashboard' | 'user-dashboard'
  adminTab: 'overview' | 'users' | 'attendance' | 'attendance-recap' | 'barang' | 'barang-masuk' | 'barang-keluar'
  userTab: 'dashboard' | 'attendance' | 'attendance-recap' | 'profile'
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setView: (view: AuthState['view']) => void
  setAdminTab: (tab: AuthState['adminTab']) => void
  setUserTab: (tab: AuthState['userTab']) => void
  checkSession: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  view: 'login',
  adminTab: 'overview',
  userTab: 'dashboard',

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setView: (view) => set({ view }),
  setAdminTab: (adminTab) => set({ adminTab }),
  setUserTab: (userTab) => set({ userTab }),

  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        const user = data.user
        set({
          user,
          view: user.role === 'ADMIN' ? 'admin-dashboard' : 'user-dashboard',
          isLoading: false
        })
      } else {
        set({ user: null, view: 'login', isLoading: false })
      }
    } catch {
      set({ user: null, view: 'login', isLoading: false })
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        const user = data.user
        set({
          user,
          view: user.role === 'ADMIN' ? 'admin-dashboard' : 'user-dashboard'
        })
        return { success: true }
      }
      return { success: false, error: data.error || 'Login gagal' }
    } catch {
      return { success: false, error: 'Terjadi kesalahan jaringan' }
    }
  },

  register: async (registerData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })
      const data = await res.json()
      if (res.ok) {
        set({ view: 'login' })
        return { success: true }
      }
      return { success: false, error: data.error || 'Registrasi gagal' }
    } catch {
      return { success: false, error: 'Terjadi kesalahan jaringan' }
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      set({ user: null, view: 'login', adminTab: 'overview', userTab: 'dashboard', isLoading: false })
    }
  }
}))
