'use client'

import { useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load all view components to reduce initial bundle/memory
const LoginForm = lazy(() => import('@/components/auth/login-form').then(m => ({ default: m.LoginForm })))
const RegisterForm = lazy(() => import('@/components/auth/register-form').then(m => ({ default: m.RegisterForm })))
const AdminLayout = lazy(() => import('@/components/admin/admin-layout').then(m => ({ default: m.AdminLayout })))
const UserLayout = lazy(() => import('@/components/user/user-layout').then(m => ({ default: m.UserLayout })))

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-48 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  )
}

export default function Home() {
  const { view, isLoading, checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isLoading) {
    return <LoadingFallback />
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      {view === 'register' && <RegisterForm />}
      {view === 'admin-dashboard' && <AdminLayout />}
      {view === 'user-dashboard' && <UserLayout />}
      {(view === 'login' || (!view)) && <LoginForm />}
    </Suspense>
  )
}
