'use client'

import { useState, useEffect, useCallback } from 'react'
import { BugReport, BugReportStatus } from '@/types'
import { getBugReports, updateBugReportStatus } from '@/lib/adminFirestore'
import { RefreshIcon } from '@/components/Icons/Icons'
import styles from './Admin.module.css'

type FilterType = 'all' | 'pending' | 'reviewed' | 'resolved'

interface BugReportsPanelProps {
  adminEmail: string
}

export default function BugReportsPanel({ adminEmail }: BugReportsPanelProps) {
  const [reports, setReports] = useState<BugReport[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    try {
      const statusFilter = filter === 'all' ? undefined : filter as BugReportStatus
      const data = await getBugReports(statusFilter)
      setReports(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading bug reports:', error)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    loadReports().finally(() => setLoading(false))
  }, [loadReports])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadReports()
    }, 60000)

    return () => clearInterval(interval)
  }, [loadReports])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadReports()
    setRefreshing(false)
  }

  const handleStatusUpdate = async (reportId: string, newStatus: BugReportStatus) => {
    setUpdatingId(reportId)
    try {
      await updateBugReportStatus(reportId, newStatus, adminEmail)
      // Update local state
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: newStatus } : r
      ))
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (timestamp: BugReport['createdAt']) => {
    if (!timestamp) return '-'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string)
    return date.toLocaleString()
  }

  const getContextTypeLabel = (type: BugReport['contextType']) => {
    switch (type) {
      case 'essay_check': return 'Essay Check'
      case 'essay_review': return 'Essay Review'
      case 'quiz_grade': return 'Quiz Grade'
      default: return type
    }
  }

  const getStatusBadgeClass = (status: BugReportStatus) => {
    switch (status) {
      case 'pending': return styles.statusPending
      case 'reviewed': return styles.statusReviewed
      case 'resolved': return styles.statusResolved
      default: return ''
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading bug reports...</p>
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
            All Reports
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'pending' ? styles.filterActive : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'reviewed' ? styles.filterActive : ''}`}
            onClick={() => setFilter('reviewed')}
          >
            Reviewed
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'resolved' ? styles.filterActive : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
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

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className={styles.bugReportsList}>
          {reports.map((report) => (
            <div key={report.id} className={styles.bugReportCard}>
              {/* Report Header */}
              <div 
                className={styles.bugReportHeader}
                onClick={() => toggleExpand(report.id)}
              >
                <div className={styles.bugReportHeaderLeft}>
                  <span className={`${styles.bugReportStatus} ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                  <span className={styles.bugReportType}>
                    {getContextTypeLabel(report.contextType)}
                  </span>
                  <span className={styles.bugReportUser}>
                    {report.displayName || report.userEmail}
                  </span>
                </div>
                <div className={styles.bugReportHeaderRight}>
                  <span className={styles.bugReportResult}>
                    {report.selfReviewResult.isCorrect ? (
                      <span className={styles.aiCorrect}>AI Correct</span>
                    ) : (
                      <span className={styles.aiWrong}>AI Wrong</span>
                    )}
                  </span>
                  <span className={styles.bugReportDate}>
                    {formatDate(report.createdAt)}
                  </span>
                  <span className={styles.expandIcon}>
                    {expandedId === report.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === report.id && (
                <div className={styles.bugReportDetails}>
                  <div className={styles.bugReportSection}>
                    <h4 className={styles.bugReportSectionTitle}>User Info</h4>
                    <p><strong>Email:</strong> {report.userEmail}</p>
                    <p><strong>Name:</strong> {report.displayName || 'N/A'}</p>
                    <p><strong>User ID:</strong> {report.userId}</p>
                  </div>

                  {report.originalPrompt && (
                    <div className={styles.bugReportSection}>
                      <h4 className={styles.bugReportSectionTitle}>Original Prompt</h4>
                      <pre className={styles.bugReportPre}>{report.originalPrompt}</pre>
                    </div>
                  )}

                  <div className={styles.bugReportSection}>
                    <h4 className={styles.bugReportSectionTitle}>User Content</h4>
                    <pre className={styles.bugReportPre}>{report.userContent}</pre>
                  </div>

                  <div className={styles.bugReportSection}>
                    <h4 className={styles.bugReportSectionTitle}>AI Response (Contested)</h4>
                    <pre className={styles.bugReportPre}>{report.originalResponse}</pre>
                  </div>

                  <div className={styles.bugReportSection}>
                    <h4 className={styles.bugReportSectionTitle}>Self-Review Result</h4>
                    <p>
                      <strong>AI was:</strong>{' '}
                      {report.selfReviewResult.isCorrect ? (
                        <span className={styles.aiCorrect}>Correct</span>
                      ) : (
                        <span className={styles.aiWrong}>Wrong</span>
                      )}
                    </p>
                    {report.selfReviewResult.correctionFeedback && (
                      <>
                        <p><strong>Correction Feedback:</strong></p>
                        <pre className={styles.bugReportPre}>{report.selfReviewResult.correctionFeedback}</pre>
                      </>
                    )}
                  </div>

                  {report.adminNotes && (
                    <div className={styles.bugReportSection}>
                      <h4 className={styles.bugReportSectionTitle}>Admin Notes</h4>
                      <p>{report.adminNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.bugReportActions}>
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                        disabled={updatingId === report.id}
                        className={styles.actionButton}
                      >
                        {updatingId === report.id ? 'Updating...' : 'Mark as Reviewed'}
                      </button>
                    )}
                    {report.status !== 'resolved' && (
                      <button
                        onClick={() => handleStatusUpdate(report.id, 'resolved')}
                        disabled={updatingId === report.id}
                        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                      >
                        {updatingId === report.id ? 'Updating...' : 'Mark as Resolved'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.sessionsTable}>
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>No bug reports</span>
            <p className={styles.emptyStateText}>
              No {filter === 'all' ? 'bug reports' : `${filter} reports`} found
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
