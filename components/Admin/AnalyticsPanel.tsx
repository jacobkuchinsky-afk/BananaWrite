'use client'

import { useState, useEffect } from 'react'
import { DailyAnalytics } from '@/types'
import { getDailyAnalytics, getAnalyticsRange, getTotalUserCount, getLessonProgressDistribution, getUserGrowthData } from '@/lib/adminFirestore'
import styles from './Admin.module.css'

const WRITING_TECHNIQUES = [
  "Commas", "Periods", "Semicolons", "Colons", "Apostrophes",
  "Quotation marks", "Question marks", "Hyphens", "Dashes",
  "Parentheses", "Brackets", "Ellipses", "Subject-verb agree.",
  "Verb conjugation", "Pronoun-antecedent", "Active/passive voice",
  "Parallel structure", "Modifiers", "Compound sent.", "Complex sent.",
  "Compound-complex", "Subordinating conj.", "Coordinating conj.",
  "Transitional phrases", "Point of view", "Paragraph structure", "Topic sentences",
  "Thesis statements", "Metaphors/similes", "Capitalization", "Dialogue format",
  "Citation styles"
]

function MiniLineChart({ data, color = '#1a1a1a', height = 120 }: { 
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  if (data.length === 0) return null

  const maxVal = Math.max(...data.map(d => d.value), 1)
  const width = 100
  const padding = { top: 10, right: 5, bottom: 20, left: 5 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
    const y = padding.top + chartH - (d.value / maxVal) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: `${height}px` }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line
          key={pct}
          x1={padding.left}
          y1={padding.top + chartH * (1 - pct)}
          x2={padding.left + chartW}
          y2={padding.top + chartH * (1 - pct)}
          stroke="rgba(26,26,26,0.08)"
          strokeWidth="0.3"
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
      ))}
      {/* X-axis labels */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={height - 3} textAnchor="middle" fontSize="3.5" fill="rgba(26,26,26,0.5)">
          {p.label}
        </text>
      ))}
    </svg>
  )
}

export default function AnalyticsPanel() {
  const [todayStats, setTodayStats] = useState<DailyAnalytics | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyAnalytics[]>([])
  const [extendedData, setExtendedData] = useState<DailyAnalytics[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [lessonDistribution, setLessonDistribution] = useState<Record<number, number>>({})
  const [userGrowth, setUserGrowth] = useState<{ date: string; newUsers: number; cumulativeUsers: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [today, weekly, extended, users, lessons, growth] = await Promise.all([
          getDailyAnalytics(),
          getAnalyticsRange(7),
          getAnalyticsRange(14),
          getTotalUserCount(),
          getLessonProgressDistribution(),
          getUserGrowthData(14)
        ])
        
        setTodayStats(today)
        setWeeklyData(weekly)
        setExtendedData(extended)
        setTotalUsers(users)
        setLessonDistribution(lessons)
        setUserGrowth(growth)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  // Calculate weekly totals
  const weeklyTotals = weeklyData.reduce((acc, day) => ({
    essays: acc.essays + (day.essaysSubmitted || 0),
    quizzes: acc.quizzes + (day.quizzesCompleted || 0),
    passed: acc.passed + (day.quizzesPassed || 0)
  }), { essays: 0, quizzes: 0, passed: 0 })

  const weeklyPassRate = weeklyTotals.quizzes > 0 
    ? Math.round((weeklyTotals.passed / weeklyTotals.quizzes) * 100)
    : 0

  // Get error types breakdown (aggregate from all days)
  const errorBreakdown: Record<string, number> = {}
  weeklyData.forEach(day => {
    if (day.errorTypesBreakdown) {
      Object.entries(day.errorTypesBreakdown).forEach(([type, count]) => {
        errorBreakdown[type] = (errorBreakdown[type] || 0) + count
      })
    }
  })

  const sortedErrors = Object.entries(errorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const maxErrorCount = sortedErrors.length > 0 ? sortedErrors[0][1] : 0

  // --- NEW METRIC 1: Quiz Score Trend (14 days) ---
  const scoreData = extendedData
    .slice()
    .reverse()
    .filter(d => d.quizzesCompleted > 0)
    .map(d => ({
      label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(d.averageQuizScore)
    }))

  // --- NEW METRIC 2: Completion Funnel ---
  const funnelData = {
    essays: weeklyTotals.essays,
    quizzes: weeklyTotals.quizzes,
    passed: weeklyTotals.passed
  }
  const funnelMax = Math.max(funnelData.essays, 1)

  // --- NEW METRIC 3: Lesson Progress Distribution ---
  const lessonEntries = Object.entries(lessonDistribution)
    .map(([lesson, count]) => ({ lesson: Number(lesson), count }))
    .sort((a, b) => a.lesson - b.lesson)
  const maxLessonCount = lessonEntries.length > 0 ? Math.max(...lessonEntries.map(e => e.count)) : 1

  // --- NEW METRIC 4: User Growth ---
  const growthChartData = userGrowth.map(d => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.newUsers
  }))
  const totalNewUsersThisWeek = userGrowth.slice(-7).reduce((sum, d) => sum + d.newUsers, 0)

  // --- NEW METRIC 5: Learning Efficiency ---
  const efficiencyData = extendedData
    .slice()
    .reverse()
    .filter(d => d.quizzesPassed > 0)
    .map(d => ({
      label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round((d.essaysSubmitted / d.quizzesPassed) * 10) / 10
    }))
  
  const weeklyEfficiency = weeklyTotals.passed > 0
    ? Math.round((weeklyTotals.essays / weeklyTotals.passed) * 10) / 10
    : 0

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className={styles.sessionsPanel}>
      {/* Stats Cards */}
      <div className={styles.analyticsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statCardValue}>{totalUsers}</span>
          <span className={styles.statCardLabel}>Total Users</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statCardValue}>{todayStats?.essaysSubmitted || 0}</span>
          <span className={styles.statCardLabel}>Essays Today</span>
          <span className={styles.statCardSubtext}>
            {weeklyTotals.essays} this week
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statCardValue}>{todayStats?.quizzesCompleted || 0}</span>
          <span className={styles.statCardLabel}>Quizzes Today</span>
          <span className={styles.statCardSubtext}>
            {weeklyTotals.quizzes} this week
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statCardValue}>
            {todayStats?.quizzesCompleted ? 
              Math.round((todayStats.quizzesPassed || 0) / todayStats.quizzesCompleted * 100) : 0}%
          </span>
          <span className={styles.statCardLabel}>Pass Rate Today</span>
          <span className={styles.statCardSubtext}>
            {weeklyPassRate}% weekly avg
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statCardValue}>
            {todayStats?.averageQuizScore ? Math.round(todayStats.averageQuizScore) : 0}%
          </span>
          <span className={styles.statCardLabel}>Avg Quiz Score</span>
        </div>
      </div>

      {/* NEW: Quiz Score Trend */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Average Quiz Score Trend (14 Days)</h3>
        <p className={styles.chartSubtitle}>
          Tracks whether users are improving over time
        </p>
        {scoreData.length > 1 ? (
          <div className={styles.lineChartContainer}>
            <div className={styles.lineChartYAxis}>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className={styles.lineChartArea}>
              <MiniLineChart data={scoreData.map(d => ({ ...d, value: d.value }))} color="#1a1a1a" height={160} />
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>Need at least 2 days of quiz data to show trend</p>
          </div>
        )}
      </div>

      {/* NEW: Completion Funnel */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Weekly Completion Funnel</h3>
        <p className={styles.chartSubtitle}>
          Shows where users drop off in the essay → quiz → pass pipeline
        </p>
        {funnelData.essays > 0 ? (
          <div className={styles.funnelChart}>
            <div className={styles.funnelStep}>
              <div className={styles.funnelBarWrapper}>
                <div className={styles.funnelBar} style={{ width: '100%' }}>
                  <span className={styles.funnelBarLabel}>{funnelData.essays}</span>
                </div>
              </div>
              <div className={styles.funnelStepInfo}>
                <span className={styles.funnelStepName}>Essays Submitted</span>
                <span className={styles.funnelStepPct}>100%</span>
              </div>
            </div>
            <div className={styles.funnelConnector}>
              <span className={styles.funnelDropoff}>
                {funnelData.essays > 0 ? `${Math.round((1 - funnelData.quizzes / funnelData.essays) * 100)}% drop-off` : ''}
              </span>
            </div>
            <div className={styles.funnelStep}>
              <div className={styles.funnelBarWrapper}>
                <div className={styles.funnelBar} data-level="mid" style={{ width: `${Math.max((funnelData.quizzes / funnelMax) * 100, 4)}%` }}>
                  <span className={styles.funnelBarLabel}>{funnelData.quizzes}</span>
                </div>
              </div>
              <div className={styles.funnelStepInfo}>
                <span className={styles.funnelStepName}>Quizzes Taken</span>
                <span className={styles.funnelStepPct}>
                  {funnelData.essays > 0 ? `${Math.round((funnelData.quizzes / funnelData.essays) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
            <div className={styles.funnelConnector}>
              <span className={styles.funnelDropoff}>
                {funnelData.quizzes > 0 ? `${Math.round((1 - funnelData.passed / funnelData.quizzes) * 100)}% fail rate` : ''}
              </span>
            </div>
            <div className={styles.funnelStep}>
              <div className={styles.funnelBarWrapper}>
                <div className={styles.funnelBar} data-level="end" style={{ width: `${Math.max((funnelData.passed / funnelMax) * 100, 4)}%` }}>
                  <span className={styles.funnelBarLabel}>{funnelData.passed}</span>
                </div>
              </div>
              <div className={styles.funnelStepInfo}>
                <span className={styles.funnelStepName}>Quizzes Passed</span>
                <span className={styles.funnelStepPct}>
                  {funnelData.essays > 0 ? `${Math.round((funnelData.passed / funnelData.essays) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No essay submissions this week yet</p>
          </div>
        )}
      </div>

      {/* NEW: Lesson Progress Distribution */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Lesson Progress Distribution</h3>
        <p className={styles.chartSubtitle}>
          Where users currently are — spikes reveal lessons that stall progress
        </p>
        {lessonEntries.length > 0 ? (
          <div className={styles.barChart}>
            {lessonEntries.map(({ lesson, count }) => (
              <div key={lesson} className={styles.barItem}>
                <span className={styles.barLabel} title={WRITING_TECHNIQUES[lesson] || `Lesson ${lesson}`}>
                  {lesson}. {WRITING_TECHNIQUES[lesson] || `Lesson ${lesson}`}
                </span>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.barFill}
                    style={{ width: `${(count / maxLessonCount) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>{count} {count === 1 ? 'user' : 'users'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No user progress data available</p>
          </div>
        )}
      </div>

      {/* NEW: User Growth */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>User Growth (14 Days)</h3>
        <p className={styles.chartSubtitle}>
          New signups per day — {totalNewUsersThisWeek} new {totalNewUsersThisWeek === 1 ? 'user' : 'users'} this week
        </p>
        {userGrowth.length > 0 ? (
          <div className={styles.userGrowthContent}>
            <div className={styles.growthStatsRow}>
              <div className={styles.growthMiniStat}>
                <span className={styles.growthMiniStatValue}>
                  {userGrowth[userGrowth.length - 1]?.cumulativeUsers || 0}
                </span>
                <span className={styles.growthMiniStatLabel}>Total Users</span>
              </div>
              <div className={styles.growthMiniStat}>
                <span className={styles.growthMiniStatValue}>{totalNewUsersThisWeek}</span>
                <span className={styles.growthMiniStatLabel}>New This Week</span>
              </div>
              <div className={styles.growthMiniStat}>
                <span className={styles.growthMiniStatValue}>
                  {Math.round(userGrowth.slice(-14).reduce((s, d) => s + d.newUsers, 0) / 14 * 10) / 10}
                </span>
                <span className={styles.growthMiniStatLabel}>Avg/Day (14d)</span>
              </div>
            </div>
            <div className={styles.lineChartArea}>
              <MiniLineChart data={growthChartData} color="#22c55e" height={140} />
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No user growth data available</p>
          </div>
        )}
      </div>

      {/* NEW: Learning Efficiency */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Learning Efficiency</h3>
        <p className={styles.chartSubtitle}>
          Essays submitted per quiz pass — lower means users learn faster with fewer attempts
        </p>
        <div className={styles.efficiencyContent}>
          <div className={styles.efficiencyHighlight}>
            <span className={styles.efficiencyValue}>
              {weeklyEfficiency > 0 ? weeklyEfficiency : '—'}
            </span>
            <span className={styles.efficiencyUnit}>essays per pass</span>
            <span className={styles.efficiencyCaption}>this week</span>
          </div>
          {efficiencyData.length > 1 ? (
            <div className={styles.lineChartArea}>
              <MiniLineChart data={efficiencyData} color="#f59e0b" height={120} />
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>Need more data to show efficiency trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Types Breakdown */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Most Common Errors (This Week)</h3>
        
        {sortedErrors.length > 0 ? (
          <div className={styles.barChart}>
            {sortedErrors.map(([errorType, count]) => (
              <div key={errorType} className={styles.barItem}>
                <span className={styles.barLabel}>{errorType}</span>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.barFill}
                    style={{ width: `${(count / maxErrorCount) * 100}%` }}
                  />
                </div>
                <span className={styles.barValue}>{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No error data available yet</p>
          </div>
        )}
      </div>

      {/* Weekly Activity */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>Weekly Activity</h3>
        
        {weeklyData.length > 0 ? (
          <div className={styles.barChart}>
            {weeklyData.slice().reverse().map((day) => {
              const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const totalActivity = (day.essaysSubmitted || 0) + (day.quizzesCompleted || 0)
              const maxActivity = Math.max(...weeklyData.map(d => (d.essaysSubmitted || 0) + (d.quizzesCompleted || 0)), 1)
              
              return (
                <div key={day.date} className={styles.barItem}>
                  <span className={styles.barLabel}>{dayLabel}</span>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFill}
                      style={{ width: `${(totalActivity / maxActivity) * 100}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>
                    {day.essaysSubmitted || 0}E / {day.quizzesCompleted || 0}Q
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No activity data available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
