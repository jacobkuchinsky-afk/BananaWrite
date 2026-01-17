'use client'

import { useState, useEffect } from 'react'
import { DailyAnalytics } from '@/types'
import { getDailyAnalytics, getAnalyticsRange, getTotalUserCount } from '@/lib/adminFirestore'
import styles from './Admin.module.css'

export default function AnalyticsPanel() {
  const [todayStats, setTodayStats] = useState<DailyAnalytics | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyAnalytics[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [today, weekly, users] = await Promise.all([
          getDailyAnalytics(),
          getAnalyticsRange(7),
          getTotalUserCount()
        ])
        
        setTodayStats(today)
        setWeeklyData(weekly)
        setTotalUsers(users)
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

  // Sort error types by count
  const sortedErrors = Object.entries(errorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const maxErrorCount = sortedErrors.length > 0 ? sortedErrors[0][1] : 0

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
