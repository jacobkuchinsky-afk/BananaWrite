'use client'

import { useState, FormEvent } from 'react'
import { SendIcon, MessageIcon } from '@/components/Icons/Icons'
import styles from './Notifications.module.css'

interface NewReportFormProps {
  onSubmit: (message: string) => Promise<void>
  disabled?: boolean
}

export default function NewReportForm({ onSubmit, disabled = false }: NewReportFormProps) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || submitting || disabled) return

    setSubmitting(true)
    try {
      await onSubmit(message.trim())
      setMessage('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.newReportForm}>
      <h3 className={styles.formTitle}>
        <MessageIcon size={18} />
        Submit a Report
      </h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question..."
          className={styles.formTextarea}
          disabled={submitting || disabled}
          rows={3}
        />
        
        <div className={styles.formActions}>
          {submitted ? (
            <span style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500 }}>
              Report submitted successfully!
            </span>
          ) : (
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!message.trim() || submitting || disabled}
            >
              <SendIcon size={16} />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
