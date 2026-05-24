'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Menu,
  LogOut,
  UserCircle,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const AdminOverview = lazy(() => import('./admin-overview').then(m => ({ default: m.AdminOverview })))
const AdminUsers = lazy(() => import('./admin-users').then(m => ({ default: m.AdminUsers })))
const AdminAttendance = lazy(() => import('./admin-attendance').then(m => ({ default: m.AdminAttendance })))
const AdminBarang = lazy(() => import('./admin-barang').then(m => ({ default: m.AdminBarang })))
const AdminBarangMasuk = lazy(() => import('./admin-barang-masuk').then(m => ({ default: m.AdminBarangMasuk })))
const AdminBarangKeluar = lazy(() => import('./admin-barang-keluar').then(m => ({ default: m.AdminBarangKeluar })))

type AdminTab = 'overview' | 'users' | 'attendance' | 'barang' | 'barang-masuk' | 'barang-keluar'

const navItems = [
  { key: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { key: 'users' as const, label: 'Pengguna', icon: Users },
  { key: 'attendance' as const, label: 'Kehadiran', icon: CalendarCheck },
  { key: 'barang' as const, label: 'Barang', icon: Package },
  { key: 'barang-masuk' as const, label: 'Barang Masuk', icon: ArrowDownCircle },
  { key: 'barang-keluar' as const, label: 'Barang Keluar', icon: ArrowUpCircle },
]

const tabLabels: Record<AdminTab, string> = {
  overview: 'Dashboard',
  users: 'Manajemen Pengguna',
  attendance: 'Data Kehadiran',
  barang: 'Manajemen Barang',
  'barang-masuk': 'Laporan Barang Masuk',
  'barang-keluar': 'Laporan Barang Keluar',
}

function SidebarNav({
  activeTab,
  onNavClick,
}: {
  activeTab: AdminTab
  onNavClick: (tab: AdminTab) => void
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item, idx) => {
        const isActive = activeTab === item.key
        const isInventoryTab = ['barang', 'barang-masuk', 'barang-keluar'].includes(item.key)

        return (
          <div key={item.key}>
            {idx === 3 && (
              <div className="px-3 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Inventaris
                </span>
              </div>
            )}
            <button
              onClick={() => onNavClick(item.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full ${
                isActive
                  ? 'bg-slate-700/50 text-white border-l-2 border-emerald-400 pl-[10px]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent pl-[10px]'
              } ${isInventoryTab ? 'text-[13px]' : ''}`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isInventoryTab ? 'h-4 w-4' : ''}`} />
              <span>{item.label}</span>
            </button>
          </div>
        )
      })}
    </nav>
  )
}

export function AdminLayout() {
  const { user, adminTab, setAdminTab, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (tab: AdminTab) => {
    setAdminTab(tab)
    setMobileOpen(false)
  }

  const renderContent = () => {
    switch (adminTab) {
      case 'overview':
        return <AdminOverview />
      case 'users':
        return <AdminUsers />
      case 'attendance':
        return <AdminAttendance />
      case 'barang':
        return <AdminBarang />
      case 'barang-masuk':
        return <AdminBarangMasuk />
      case 'barang-keluar':
        return <AdminBarangKeluar />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6">
          <CalendarCheck className="h-7 w-7 text-emerald-400" />
          <span className="text-xl font-bold tracking-tight">AttendEase</span>
        </div>
        <Separator className="bg-slate-700" />
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav activeTab={adminTab} onNavClick={handleNavClick} />
        </div>
        <Separator className="bg-slate-700" />
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-2.5">
            <UserCircle className="h-8 w-8 text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between bg-white px-4 shadow-sm sm:px-6">
          {/* Mobile menu */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-slate-900 text-white p-0 border-slate-700">
                <SheetHeader className="px-6 pt-6 pb-0">
                  <SheetTitle className="text-white flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6 text-emerald-400" />
                    AttendEase
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNav activeTab={adminTab} onNavClick={handleNavClick} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">
              <CalendarCheck className="h-6 w-6 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900">AttendEase</span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-slate-900">
                {tabLabels[adminTab as AdminTab] || 'Dashboard'}
              </h2>
            </div>
          </div>

          {/* User dropdown */}
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 sm:block">
              {user?.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6 text-slate-500" />
                  <span className="sr-only">Profil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Separator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Suspense fallback={
            <div className="space-y-6 p-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={adminTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
