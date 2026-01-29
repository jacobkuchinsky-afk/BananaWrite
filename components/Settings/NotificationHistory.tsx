'use client'

import { useState, useEffect } from 'react'
import { UpdateNotification } from '@/types'
import { getAllUpdateNotifications } from '@/lib/adminFirestore'
import styles from './Settings.module.css'

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<UpdateNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Load notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getAllUpdateNotifications()
        setNotifications(data)
      } catch (err) {
        console.error('Error loading notification history:', err)
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }, [])

  // Format date
  function formatDate(timestamp: { toDate: () => Date } | null): string {
    if (!timestamp) return 'Unknown date'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Toggle expanded
  function toggleExpanded(id: string) {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className={styles.historyLoading}>
        <span className={styles.spinner}></span>
        <span>Loading update history...</span>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.historyEmpty}>
        <p>No update announcements yet</p>
      </div>
    )
  }

  return (
    <div className={styles.historyList}>
      {notifications.map((notification) => {
        const isExpanded = expandedId === notification.id
        
        return (
          <div key={notification.id} className={styles.historyItem}>
            <button
              className={styles.historyItemHeader}
              onClick={() => toggleExpanded(notification.id)}
              aria-expanded={isExpanded}
            >
              <div className={styles.historyItemLeft}>
                <span className={styles.historyItemIcon}>📢</span>
                <span className={styles.historyItemTitle}>{notification.title}</span>
              </div>
              <div className={styles.historyItemRight}>
                <span className={styles.historyItemDate}>
                  {formatDate(notification.createdAt as { toDate: () => Date } | null)}
                </span>
                <span className={`${styles.historyItemChevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
                  ▼
                </span>
              </div>
            </button>
            
            {isExpanded && (
              <div className={styles.historyItemContent}>
                <ul className={styles.historyItemBullets}>
                  {notification.bulletPoints.map((point, index) => (
                    <li key={index} className={styles.historyItemBullet}>
                      <span className={styles.historyBulletDot}>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
