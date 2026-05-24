'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Stats {
  totalEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  attendanceRate: number
  last7Days: {
    date: string
    present: number
    late: number
    absent: number
  }[]
}

const statCards = [
  {
    key: 'totalEmployees' as const,
    label: 'Total Karyawan',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    key: 'presentToday' as const,
    label: 'Hadir Hari Ini',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    key: 'lateToday' as const,
    label: 'Terlambat',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    key: 'absentToday' as const,
    label: 'Tidak Hadir',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
]

const chartConfig: ChartConfig = {
  present: { label: 'Hadir', color: '#10b981' },
  late: { label: 'Terlambat', color: '#f59e0b' },
  absent: { label: 'Tidak Hadir', color: '#ef4444' },
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/attendance/stats')
        if (!res.ok) throw new Error('Gagal memuat data statistik')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const chartData = stats?.last7Days.map((d) => ({
    date: d.date.slice(5),
    present: d.present,
    late: d.late,
    absent: d.absent,
  })) ?? []

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key} className={`${card.border} border`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {card.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {stats?.[card.key] ?? 0}
                  </span>
                  {card.key === 'presentToday' && stats && (
                    <span className="flex items-center text-xs text-emerald-600 font-medium">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {stats.attendanceRate}%
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Kehadiran 7 Hari Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Bar
                  dataKey="present"
                  fill="var(--color-present)"
                  radius={[4, 4, 0, 0]}
                  name="Hadir"
                />
                <Bar
                  dataKey="late"
                  fill="var(--color-late)"
                  radius={[4, 4, 0, 0]}
                  name="Terlambat"
                />
                <Bar
                  dataKey="absent"
                  fill="var(--color-absent)"
                  radius={[4, 4, 0, 0]}
                  name="Tidak Hadir"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
