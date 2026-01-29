'use client'

import { useState } from 'react'
import { UpdateNotification } from '@/types'
import styles from './Dashboard.module.css'

interface UpdateNotificationModalProps {
  notification: UpdateNotification
  onDismiss: () => void
}

export default function UpdateNotificationModal({ 
  notification, 
  onDismiss 
}: UpdateNotificationModalProps) {
  const [dismissing, setDismissing] = useState(false)

  async function handleDismiss() {
    setDismissing(true)
    try {
      await onDismiss()
    } catch (error) {
      console.error('Error dismissing notification:', error)
      setDismissing(false)
    }
  }

  // Format date
  function formatDate(timestamp: { toDate: () => Date } | null): string {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={styles.updateModalOverlay}>
      <div className={styles.updateModalContent}>
        {/* Decorative Header */}
        <div className={styles.updateModalHeader}>
          <span className={styles.updateModalBadge}>What&apos;s New</span>
        </div>

        {/* Title */}
        <h1 className={styles.updateModalTitle}>
          {notification.title}
        </h1>

        {/* Date */}
        <p className={styles.updateModalDate}>
          {formatDate(notification.createdAt as { toDate: () => Date } | null)}
        </p>

        {/* Bullet Points */}
        <ul className={styles.updateModalList}>
          {notification.bulletPoints.map((point, index) => (
            <li key={index} className={styles.updateModalListItem}>
              <span className={styles.updateModalCheckmark}>✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {/* Dismiss Button */}
        <button
          className={styles.updateModalButton}
          onClick={handleDismiss}
          disabled={dismissing}
        >
          {dismissing ? 'Got it!' : 'Got it!'}
        </button>
      </div>
    </div>
  )
}
