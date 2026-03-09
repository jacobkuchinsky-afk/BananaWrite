'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { QuizHistoryEntry, UserProfile, UserProgress, UserSettings } from '@/types'
import {
  getStudentQuizHistory,
  getStudentFullProfile,
  computeStruggleAreas,
  StruggleArea
} from '@/lib/adminFirestore'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import StudentHeader from '@/components/Teacher/StudentHeader'
import StruggleCard from '@/components/Teacher/StruggleCard'
import ActivityTimeline from '@/components/Teacher/ActivityTimeline'
import styles from '@/components/Teacher/Teacher.module.css'

type StruggleFilter = 'all' | 'needs_work' | 'mastered'

function StudentProgressContent() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string
  const { user, loading, isTeacher, isAdmin } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [sessionStatus, setSessionStatus] = useState('idle')
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [struggleFilter, setStruggleFilter] = useState<StruggleFilter>('all')

  useEffect(() => {
    if (!loading && !isTeacher && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isTeacher, isAdmin, router])

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, historyData] = await Promise.all([
          getStudentFullProfile(studentId),
          getStudentQuizHistory(studentId)
        ])
        setProfile(profileData.profile)
        setProgress(profileData.progress)
        setSettings(profileData.settings)
        setSessionStatus(profileData.sessionStatus)
        setQuizHistory(historyData)
      } catch (err) {
        console.error('Error loading student data:', err)
      } finally {
        setLoadingData(false)
      }
    }
    if (user && (isTeacher || isAdmin) && studentId) loadData()
  }, [user, isTeacher, isAdmin, studentId])

  const struggleAreas = useMemo(() => computeStruggleAreas(quizHistory), [quizHistory])

  const filteredStruggles = useMemo(() => {
    if (struggleFilter === 'needs_work') return struggleAreas.filter(a => !a.mastered)
    if (struggleFilter === 'mastered') return struggleAreas.filter(a => a.mastered)
    return struggleAreas
  }, [struggleAreas, struggleFilter])

  const overallStats = useMemo(() => {
    const total = quizHistory.length
    const passed = quizHistory.filter(q => q.passed).length
    const failed = total - passed
    const avgScore = total > 0
      ? Math.round(quizHistory.reduce((s, q) => s + q.score, 0) / total)
      : 0

    const distribution: Record<string, number> = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    for (const q of quizHistory) {
      if (q.score <= 20) distribution['0-20']++
      else if (q.score <= 40) distribution['21-40']++
      else if (q.score <= 60) distribution['41-60']++
      else if (q.score <= 80) distribution['61-80']++
      else distribution['81-100']++
    }

    return { total, passed, failed, avgScore, distribution }
  }, [quizHistory])

  if (loading || loadingData) {
    return (
      <div className={styles.teacherPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading student progress...</p>
        </div>
      </div>
    )
  }

  if (!user || (!isTeacher && !isAdmin)) return null

  const maxDistVal = Math.max(...Object.values(overallStats.distribution), 1)

  return (
    <div className={styles.teacherPage}>
      <header className={styles.teacherHeader}>
        <Link href="/teacher" className={styles.backButton}>
          <ArrowLeftIcon size={18} /> Back
        </Link>
        <h1 className={styles.pageTitle}>
          <span className={styles.badge}>Student</span>
          Progress Report
        </h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        {/* Section 1: Student Header */}
        <StudentHeader
          profile={profile}
          progress={progress}
          settings={settings}
          sessionStatus={sessionStatus}
        />

        {/* Section 2: Struggle Areas */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Struggle Areas</h2>
            <div className={styles.filterToggle} role="group" aria-label="Filter struggle areas">
              <button
                className={struggleFilter === 'all' ? styles.filterActive : styles.filterButton}
                onClick={() => setStruggleFilter('all')}
              >
                All ({struggleAreas.length})
              </button>
              <button
                className={struggleFilter === 'needs_work' ? styles.filterActive : styles.filterButton}
                onClick={() => setStruggleFilter('needs_work')}
              >
                Needs Work ({struggleAreas.filter(a => !a.mastered).length})
              </button>
              <button
                className={struggleFilter === 'mastered' ? styles.filterActive : styles.filterButton}
                onClick={() => setStruggleFilter('mastered')}
              >
                Mastered ({struggleAreas.filter(a => a.mastered).length})
              </button>
            </div>
          </div>

          {filteredStruggles.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                {quizHistory.length === 0
                  ? 'No quiz data yet. Struggle areas will appear after the student completes quizzes.'
                  : 'No items match this filter.'}
              </p>
            </div>
          ) : (
            <div className={styles.struggleGrid}>
              {filteredStruggles.map(area => (
                <StruggleCard key={area.category} area={area} />
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Recent Activity Timeline */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--spacing-md)' }}>
            Recent Activity
          </h2>
          <ActivityTimeline history={quizHistory} />
        </section>

        {/* Section 4: Overall Stats */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 'var(--spacing-lg)' }}>
            Overall Stats
          </h2>

          <div className={styles.statsRow} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{progress?.completedLessons?.length ?? 0}</span>
              <span className={styles.statLabel}>Essays Written</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{overallStats.total}</span>
              <span className={styles.statLabel}>Quizzes Taken</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: '#16a34a' }}>{overallStats.passed}</span>
              <span className={styles.statLabel}>Passed</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: '#dc2626' }}>{overallStats.failed}</span>
              <span className={styles.statLabel}>Failed</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{overallStats.avgScore}%</span>
              <span className={styles.statLabel}>Avg Score</span>
            </div>
          </div>

          {overallStats.total > 0 && (
            <>
              <h3 className={styles.cardTitle} style={{ marginBottom: 'var(--spacing-md)' }}>
                Score Distribution
              </h3>
              <div className={styles.barChart}>
                {Object.entries(overallStats.distribution).map(([range, count]) => (
                  <div key={range} className={styles.barRow}>
                    <span className={styles.barLabel}>{range}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(count / maxDistVal) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barCount}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default function StudentProgressPage() {
  return <StudentProgressContent />
}
