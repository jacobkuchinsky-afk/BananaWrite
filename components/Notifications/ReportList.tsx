'use client'

import { BugReport, BugReportContextType } from '@/types'
import { AlertIcon, MessageIcon } from '@/components/Icons/Icons'
import styles from './Notifications.module.css'

interface ReportListProps {
  reports: BugReport[]
  selectedReportId: string | null
  onSelectReport: (reportId: string) => void
  loading?: boolean
}

export default function ReportList({
  reports,
  selectedReportId,
  onSelectReport,
  loading = false
}: ReportListProps) {
  const getTypeLabel = (type: BugReportContextType) => {
    switch (type) {
      case 'essay_check':
        return 'Essay Check'
      case 'essay_review':
        return 'Essay Review'
      case 'quiz_grade':
        return 'Quiz Grade'
      case 'general':
        return 'General Report'
      default:
        return type
    }
  }

  const getTypeIcon = (type: BugReportContextType) => {
    if (type === 'general') {
      return <MessageIcon size={14} />
    }
    return <AlertIcon size={14} />
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending
      case 'reviewed':
        return styles.statusReviewed
      case 'resolved':
        return styles.statusResolved
      default:
        return ''
    }
  }

  const formatDate = (timestamp: BugReport['createdAt']) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes <= 1 ? 'Just now' : `${minutes}m ago`
      }
      return `${hours}h ago`
    }
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const getPreviewText = (report: BugReport) => {
    if (report.contextType === 'general') {
      return report.userContent
    }
    // For AI-related reports, show the original response preview
    return report.originalResponse || report.userContent
  }

  if (loading) {
    return (
      <div className={styles.reportList}>
        <div className={styles.reportListHeader}>
          <span className={styles.reportListTitle}>Your Reports</span>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.reportList}>
      <div className={styles.reportListHeader}>
        <span className={styles.reportListTitle}>Your Reports</span>
        <span className={styles.reportCount}>{reports.length} total</span>
      </div>
      
      <div className={styles.reportListBody}>
        {reports.length === 0 ? (
          <div className={styles.emptyReports}>
            <span className={styles.emptyReportsIcon}>No reports</span>
            <p className={styles.emptyReportsText}>
              No reports yet. Submit a report above or use the "I think this is wrong" button when you disagree with AI feedback.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className={`${styles.reportItem} ${selectedReportId === report.id ? styles.reportItemActive : ''}`}
              onClick={() => onSelectReport(report.id)}
            >
              <div className={styles.reportItemHeader}>
                <span className={styles.reportItemType}>
                  <span className={styles.reportItemTypeIcon}>
                    {getTypeIcon(report.contextType)}
                  </span>
                  {getTypeLabel(report.contextType)}
                </span>
                <span className={`${styles.reportItemStatus} ${getStatusClass(report.status)}`}>
                  {report.status}
                </span>
              </div>
              <p className={styles.reportItemPreview}>
                {getPreviewText(report).slice(0, 80)}
                {getPreviewText(report).length > 80 ? '...' : ''}
              </p>
              <span className={styles.reportItemDate}>
                {formatDate(report.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
