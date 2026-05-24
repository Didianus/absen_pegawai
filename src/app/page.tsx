'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { AdminLayout } from '@/components/admin/admin-layout'
import { UserLayout } from '@/components/user/user-layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { view, isLoading, checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  if (isLoading) {
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

  switch (view) {
    case 'login':
      return <LoginForm />
    case 'register':
      return <RegisterForm />
    case 'admin-dashboard':
      return <AdminLayout />
    case 'user-dashboard':
      return <UserLayout />
    default:
      return <LoginForm />
  }
}
