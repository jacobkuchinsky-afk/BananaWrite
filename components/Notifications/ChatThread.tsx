'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { BugReport, BugReportMessage, BugReportContextType } from '@/types'
import { SendIcon } from '@/components/Icons/Icons'
import styles from './Notifications.module.css'

interface ChatThreadProps {
  report: BugReport | null
  messages: BugReportMessage[]
  onSendMessage: (content: string) => Promise<void>
  loading?: boolean
  currentUserId?: string
}

export default function ChatThread({
  report,
  messages,
  onSendMessage,
  loading = false,
  currentUserId
}: ChatThreadProps) {
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    setSending(true)
    try {
      await onSendMessage(messageText.trim())
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const getTypeLabel = (type: BugReportContextType) => {
    switch (type) {
      case 'essay_check':
        return 'Essay Check Report'
      case 'essay_review':
        return 'Essay Review Report'
      case 'quiz_grade':
        return 'Quiz Grade Report'
      case 'general':
        return 'General Report'
      default:
        return type
    }
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

  const formatTimestamp = (timestamp: BugReportMessage['createdAt']) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string)
    return date.toLocaleString()
  }

  const formatReportDate = (timestamp: BugReport['createdAt']) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as unknown as string)
    return date.toLocaleDateString()
  }

  // Show empty state if no report selected
  if (!report) {
    return (
      <div className={styles.emptyChat}>
        <p className={styles.emptyChatText}>
          Choose a report from the list to view the conversation, or submit a new report above.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.chatThread}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.chatThread}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <h3 className={styles.chatHeaderTitle}>
            {getTypeLabel(report.contextType)}
          </h3>
          <span className={styles.chatHeaderMeta}>
            Created {formatReportDate(report.createdAt)}
          </span>
        </div>
        <span className={`${styles.chatHeaderStatus} ${getStatusClass(report.status)}`}>
          {report.status}
        </span>
      </div>

      {/* Context Info for non-general reports */}
      {report.contextType !== 'general' && (
        <div className={styles.chatMessages}>
          <div className={styles.contextInfo}>
            <h4 className={styles.contextInfoTitle}>Original AI Response</h4>
            <p className={styles.contextInfoContent}>
              {report.originalResponse || 'No response available'}
            </p>
          </div>
          
          {report.selfReviewResult && (
            <div className={styles.contextInfo}>
              <h4 className={styles.contextInfoTitle}>
                AI Self-Review: {report.selfReviewResult.isCorrect ? 'AI was correct' : 'AI was incorrect'}
              </h4>
              {report.selfReviewResult.correctionFeedback && (
                <p className={styles.contextInfoContent}>
                  {report.selfReviewResult.correctionFeedback}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={styles.chatMessages}>
        {messages.length === 0 ? (
          <div className={styles.emptyReports}>
            <p className={styles.emptyReportsText}>
              No messages yet. {report.status !== 'resolved' && 'An admin will respond soon.'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.isAdmin ? styles.messageAdmin : styles.messageUser}`}
            >
              <div className={styles.messageBubble}>
                {message.content}
              </div>
              <div className={styles.messageMeta}>
                <span className={styles.messageSender}>
                  {message.isAdmin ? 'Admin' : (message.senderName || 'You')}
                </span>
                <span>{formatTimestamp(message.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {report.status !== 'resolved' && (
        <div className={styles.chatInputContainer}>
          <form onSubmit={handleSubmit} className={styles.chatInputForm}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className={styles.chatInput}
              disabled={sending}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!messageText.trim() || sending}
            >
              <SendIcon size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
