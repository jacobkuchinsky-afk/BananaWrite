'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import { getUserProgress, getXPHistory } from '@/lib/firestore'
import { UserProgress } from '@/types'
import { Timestamp } from 'firebase/firestore'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from '@/components/Stats/Stats.module.css'

type Range = '7d' | '30d' | 'all'

interface XPEntry {
  amount: number
  timestamp: Timestamp
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** Aggregate XP entries into daily totals keyed by YYYY-MM-DD. */
function aggregateByDay(entries: XPEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = e.timestamp.toDate()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + e.amount)
  }
  return map
}

/** Build a continuous daily series (filling gaps with 0) for the given range. */
function buildSeries(daily: Map<string, number>, range: Range): { label: string; value: number }[] {
  const today = startOfDay(new Date())
  let daysBack: number

  if (range === 'all') {
    if (daily.size === 0) return []
    const earliest = [...daily.keys()].sort()[0]
    const earliestDate = new Date(earliest + 'T00:00:00')
    daysBack = Math.max(7, Math.ceil((today.getTime() - earliestDate.getTime()) / 86_400_000) + 1)
  } else {
    daysBack = range === '7d' ? 7 : 30
  }

  const series: { label: string; value: number }[] = []
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    series.push({ label: formatShortDate(d), value: daily.get(key) || 0 })
  }
  return series
}

// ── SVG Line Chart ──────────────────────────────────────────────

const PADDING = { top: 16, right: 12, bottom: 28, left: 36 }

function XPChart({ series }: { series: { label: string; value: number }[] }) {
  if (series.length === 0) {
    return <div className={styles.emptyChart}>Complete a lesson to see your chart</div>
  }

  const viewW = 600
  const viewH = 270
  const plotW = viewW - PADDING.left - PADDING.right
  const plotH = viewH - PADDING.top - PADDING.bottom

  const maxVal = Math.max(...series.map(s => s.value), 1)
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5

  const xStep = series.length > 1 ? plotW / (series.length - 1) : 0
  const points = series.map((s, i) => ({
    x: PADDING.left + i * xStep,
    y: PADDING.top + plotH - (s.value / niceMax) * plotH,
    ...s
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${PADDING.top + plotH} L${points[0].x},${PADDING.top + plotH} Z`

  const gridLines = 4
  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => ({
    y: PADDING.top + (plotH / gridLines) * i,
    label: Math.round(niceMax - (niceMax / gridLines) * i)
  }))

  const labelEvery = Math.max(1, Math.ceil(series.length / 8))

  return (
    <div className={styles.chartContainer}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet">
        {gridYs.map((g, i) => (
          <g key={i}>
            <line className={styles.gridLine} x1={PADDING.left} y1={g.y} x2={viewW - PADDING.right} y2={g.y} />
            <text className={styles.axisLabel} x={PADDING.left - 6} y={g.y + 3} textAnchor="end">{g.label}</text>
          </g>
        ))}

        <path className={styles.chartArea} d={areaPath} />
        <path className={styles.chartLine} d={linePath} />

        {points.map((p, i) => (
          p.value > 0 && <circle key={i} className={styles.chartDot} cx={p.x} cy={p.y} r={3.5} />
        ))}

        {points.map((p, i) => (
          i % labelEvery === 0 && (
            <text key={`l${i}`} className={styles.axisLabel} x={p.x} y={viewH - 4} textAnchor="middle">{p.label}</text>
          )
        ))}
      </svg>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

function StatsContent() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [history, setHistory] = useState<XPEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('30d')

  useEffect(() => {
    if (!user) return
    Promise.all([getUserProgress(user.uid), getXPHistory(user.uid)])
      .then(([prog, hist]) => {
        setProgress(prog)
        setHistory(hist)
      })
      .catch(err => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false))
  }, [user])

  const daily = useMemo(() => aggregateByDay(history), [history])
  const series = useMemo(() => buildSeries(daily, range), [daily, range])

  const todayXP = useMemo(() => {
    const key = (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()
    return daily.get(key) || 0
  }, [daily])

  const weekXP = useMemo(() => {
    const weekStart = startOfWeek(new Date())
    let total = 0
    for (const e of history) {
      if (e.timestamp.toDate() >= weekStart) total += e.amount
    }
    return total
  }, [history])

  if (loading) {
    return (
      <div className={styles.statsPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading your stats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.statsPage}>
      <header className={styles.statsHeader}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeftIcon size={16} />
          Dashboard
        </Link>
        <span className={styles.statsTitle}>Your XP</span>
      </header>

      <main className={styles.statsContent}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Today</span>
            <span className={styles.summaryValue}>{todayXP}</span>
            <span className={styles.summaryUnit}>XP</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>This Week</span>
            <span className={styles.summaryValue}>{weekXP}</span>
            <span className={styles.summaryUnit}>XP</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total</span>
            <span className={styles.summaryValue}>{progress?.totalXP ?? 0}</span>
            <span className={styles.summaryUnit}>XP</span>
          </div>
        </div>

        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>XP Over Time</span>
            <div className={styles.chartRange}>
              {(['7d', '30d', 'all'] as Range[]).map(r => (
                <button
                  key={r}
                  className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ''}`}
                  onClick={() => setRange(r)}
                >
                  {r === '7d' ? '7 days' : r === '30d' ? '30 days' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <XPChart series={series} />
        </div>
      </main>
    </div>
  )
}

export default function StatsPage() {
  return (
    <ProtectedRoute requireSetup={true}>
      <StatsContent />
    </ProtectedRoute>
  )
}
