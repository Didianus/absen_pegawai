'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  UserCircle,
  Menu,
  LogOut,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { UserDashboard } from './user-dashboard'
import { UserAttendance } from './user-attendance'
import { UserProfile } from './user-profile'

const navItems = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'attendance' as const, label: 'Kehadiran Saya', icon: Calendar },
  { key: 'profile' as const, label: 'Profil', icon: UserCircle },
]

const tabLabels: Record<typeof navItems[number]['key'], string> = {
  dashboard: 'Dashboard',
  attendance: 'Kehadiran Saya',
  profile: 'Profil',
}

interface SidebarNavProps {
  activeTab: string
  onNavClick: (tab: 'dashboard' | 'attendance' | 'profile') => void
  onItemClick?: () => void
}

function SidebarNav({ activeTab, onNavClick, onItemClick }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive = activeTab === item.key
        return (
          <button
            key={item.key}
            onClick={() => {
              onNavClick(item.key)
              onItemClick?.()
            }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500 pl-[9px]'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent pl-[9px]'
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function UserLayout() {
  const { user, userTab, setUserTab, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (tab: typeof userTab) => {
    setUserTab(tab)
    setMobileOpen(false)
  }

  const renderContent = () => {
    switch (userTab) {
      case 'dashboard':
        return <UserDashboard />
      case 'attendance':
        return <UserAttendance />
      case 'profile':
        return <UserProfile />
      default:
        return <UserDashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col bg-white border-r border-slate-200">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 px-6">
          <CalendarCheck className="h-7 w-7 text-emerald-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900">AttendEase</span>
        </div>
        <Separator className="bg-slate-200" />
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav activeTab={userTab} onNavClick={handleNavClick} />
        </div>
        <Separator className="bg-slate-200" />
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <UserCircle className="h-8 w-8 text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
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
              <SheetContent side="left" className="w-56 bg-white p-0 border-slate-200">
                <SheetHeader className="px-6 pt-6 pb-0">
                  <SheetTitle className="text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6 text-emerald-600" />
                    AttendEase
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNav
                    activeTab={userTab}
                    onNavClick={handleNavClick}
                    onItemClick={() => setMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">
              <CalendarCheck className="h-6 w-6 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900">AttendEase</span>
            </div>

            {/* Desktop title */}
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-slate-900">
                {tabLabels[userTab]}
              </h2>
            </div>
          </div>

          {/* User info & logout */}
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={userTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
