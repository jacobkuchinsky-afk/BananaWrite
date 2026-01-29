'use client'

import { useState, useEffect } from 'react'
import { UpdateNotification } from '@/types'
import { createUpdateNotification, getAllUpdateNotifications } from '@/lib/adminFirestore'
import styles from './Admin.module.css'

interface UpdatesPanelProps {
  adminEmail: string
}

export default function UpdatesPanel({ adminEmail }: UpdatesPanelProps) {
  const [notifications, setNotifications] = useState<UpdateNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [bulletPointsText, setBulletPointsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load notifications
  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const data = await getAllUpdateNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    // Validate
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Please enter a title')
      return
    }
    
    // Parse bullet points (one per line, filter empty lines)
    const bulletPoints = bulletPointsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    if (bulletPoints.length === 0) {
      setError('Please enter at least one bullet point')
      return
    }
    
    setCreating(true)
    
    try {
      await createUpdateNotification(trimmedTitle, bulletPoints, adminEmail)
      
      // Reset form
      setTitle('')
      setBulletPointsText('')
      setShowCreateForm(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Reload notifications
      await loadNotifications()
    } catch (err) {
      console.error('Error creating notification:', err)
      setError('Failed to create notification. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Format date
  function formatDate(timestamp: { toDate: () => Date } | null): string {
    if (!timestamp) return 'Unknown date'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading updates...</p>
      </div>
    )
  }

  return (
    <div className={styles.updatesPanel}>
      {/* Header with Create Button */}
      <div className={styles.updatesPanelHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Update Notifications</h2>
          <p className={styles.sectionDescription}>
            Create announcements that appear as pop-ups for all users
          </p>
        </div>
        
        {!showCreateForm && (
          <button 
            className={styles.createUpdateBtn}
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Update
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className={styles.successMessage}>
          Update notification published successfully!
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className={styles.createUpdateForm}>
          <h3 className={styles.formTitle}>New Update Notification</h3>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g., New Features Released!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Bullet Points (one per line)
              </label>
              <textarea
                className={styles.formTextarea}
                placeholder="Added dark mode support&#10;Improved quiz feedback&#10;Fixed login issues"
                rows={6}
                value={bulletPointsText}
                onChange={(e) => setBulletPointsText(e.target.value)}
                disabled={creating}
              />
            </div>
            
            {error && (
              <p className={styles.formError}>{error}</p>
            )}
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowCreateForm(false)
                  setTitle('')
                  setBulletPointsText('')
                  setError(null)
                }}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.publishBtn}
                disabled={creating}
              >
                {creating ? 'Publishing...' : 'Publish Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications List */}
      <div className={styles.updatesList}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>📢</span>
            <p className={styles.emptyStateText}>
              No update notifications yet. Create one to announce new features to your users!
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className={styles.updateCard}>
              <div className={styles.updateCardHeader}>
                <h4 className={styles.updateCardTitle}>{notification.title}</h4>
                <span className={styles.updateCardDate}>
                  {formatDate(notification.createdAt as { toDate: () => Date } | null)}
                </span>
              </div>
              <ul className={styles.updateCardBullets}>
                {notification.bulletPoints.map((point, index) => (
                  <li key={index} className={styles.updateCardBullet}>
                    {point}
                  </li>
                ))}
              </ul>
              <p className={styles.updateCardMeta}>
                Published by {notification.createdBy}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
