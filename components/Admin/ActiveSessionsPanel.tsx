'use client'

import { useState, useEffect, useCallback } from 'react'
import { ActiveSession } from '@/types'
import { getAllActiveSessions, getActiveWritingSessions, getActiveQuizSessions } from '@/lib/adminFirestore'
import { RefreshIcon } from '@/components/Icons/Icons'
import styles from './Admin.module.css'

type FilterType = 'all' | 'essay' | 'quiz'

export default function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadSessions = useCallback(async () => {
    try {
      let data: ActiveSession[]
      
      switch (filter) {
        case 'essay':
          data = await getActiveWritingSessions()
          break
        case 'quiz':
          data = await getActiveQuizSessions()
          break
        default:
          data = await getAllActiveSessions()
      }
      
      setSessions(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    loadSessions().finally(() => setLoading(false))
  }, [loadSessions])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadSessions])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSessions()
    setRefreshing(false)
  }

  const formatDuration = (startedAt: ActiveSession['startedAt']) => {
    if (!startedAt) return '-'
    
    const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt as unknown as string)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  const getSessionDetails = (session: ActiveSession) => {
    if (session.sessionType === 'essay') {
      const technique = session.writingTechnique === 'None' ? 'Anything' : (session.writingTechnique || 'Anything')
      return `${technique} - ${session.wordCount || 0} words`
    }
    const topic = session.quizTopic || 'Loading...'
    const progress = session.quizProgress ? ` - ${session.quizProgress}` : ''
    return topic + progress
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading active sessions...</p>
      </div>
    )
  }

  return (
    <div className={styles.sessionsPanel}>
      {/* Controls */}
      <div className={styles.sessionControls}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All Sessions
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'essay' ? styles.filterActive : ''}`}
            onClick={() => setFilter('essay')}
          >
            Essays
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'quiz' ? styles.filterActive : ''}`}
            onClick={() => setFilter('quiz')}
          >
            Quizzes
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={styles.refreshButton}
          >
            <RefreshIcon size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      {sessions.length > 0 ? (
        <div className={styles.sessionsTable}>
          <div className={styles.sessionsTableHeader}>
            <span className={styles.sessionsTableHeaderCell}>User</span>
            <span className={styles.sessionsTableHeaderCell}>Type</span>
            <span className={styles.sessionsTableHeaderCell}>Status</span>
            <span className={styles.sessionsTableHeaderCell}>Duration</span>
            <span className={styles.sessionsTableHeaderCell}>Details</span>
          </div>
          
          <div className={styles.sessionsTableBody}>
            {sessions.map((session) => (
              <div key={session.oderId} className={styles.sessionRow}>
                <div className={styles.sessionUser}>
                  <span className={styles.sessionUserName}>
                    {session.displayName || 'Anonymous'}
                  </span>
                  <span className={styles.sessionUserEmail}>
                    {session.userEmail}
                  </span>
                </div>
                
                <span className={`${styles.sessionType} ${
                  session.sessionType === 'essay' ? styles.sessionTypeEssay : styles.sessionTypeQuiz
                }`}>
                  {session.sessionType === 'essay' ? 'Essay' : 'Quiz'}
                </span>
                
                <span className={styles.sessionStatus}>
                  {session.status}
                </span>
                
                <span className={styles.sessionDuration}>
                  {formatDuration(session.startedAt)}
                </span>
                
                <span className={styles.sessionTopic}>
                  {getSessionDetails(session)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.sessionsTable}>
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>No active sessions</span>
            <p className={styles.emptyStateText}>
              No active {filter === 'all' ? 'sessions' : filter === 'essay' ? 'essay sessions' : 'quiz sessions'} right now
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
