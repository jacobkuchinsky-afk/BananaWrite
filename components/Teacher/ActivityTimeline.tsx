'use client'

import { useState } from 'react'
import { QuizHistoryEntry } from '@/types'
import { parseErrorCategory } from '@/lib/adminFirestore'
import styles from './Teacher.module.css'

interface ActivityTimelineProps {
  history: QuizHistoryEntry[]
  limit?: number
}

export default function ActivityTimeline({ history, limit = 20 }: ActivityTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const entries = showAll ? history : history.slice(0, limit)

  const formatDate = (entry: QuizHistoryEntry): string => {
    if (!entry.timestamp?.toDate) return '—'
    const d = entry.timestamp.toDate()
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  if (history.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateText}>No quiz activity yet.</p>
      </div>
    )
  }

  return (
    <div className={styles.timeline}>
      {entries.map(entry => {
        const entryId = entry.id || `${entry.lessonNumber}-${entry.score}`
        const isExpanded = expandedId === entryId
        const topic = parseErrorCategory(entry.quizTopic)

        return (
          <div
            key={entryId}
            className={styles.timelineEntry}
            onClick={() => toggleExpand(entryId)}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(entryId) } }}
          >
            <span className={styles.timelineDate}>{formatDate(entry)}</span>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTopic}>{topic || 'Quiz'}</div>
              <div className={styles.timelineMeta}>
                {entry.writingTechnique} &middot; {entry.questionCount} question{entry.questionCount !== 1 ? 's' : ''}
              </div>

              {isExpanded && entry.userAnswers && entry.userAnswers.length > 0 && (
                <div className={styles.timelineExpanded}>
                  {entry.userAnswers.map((answer, i) => {
                    const isCorrect = answer.userAnswer?.trim().toLowerCase() === answer.correctAnswer?.trim().toLowerCase()
                    return (
                      <div key={i} className={styles.timelineExpandedItem}>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{answer.question}</div>
                        <div className={styles.answerLabel}>Student&apos;s answer:</div>
                        <div className={isCorrect ? styles.answerCorrect : styles.answerWrong}>
                          {answer.userAnswer || '(no answer)'}
                        </div>
                        {!isCorrect && (
                          <>
                            <div className={styles.answerLabel} style={{ marginTop: 4 }}>Correct answer:</div>
                            <div className={styles.answerCorrect}>{answer.correctAnswer}</div>
                          </>
                        )}
                      </div>
                    )
                  })}
                  {entry.teacherFeedback?.explanations && entry.teacherFeedback.explanations.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                      <div className={styles.answerLabel}>Feedback</div>
                      {entry.teacherFeedback.explanations.map((exp, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>{exp}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className={`${styles.timelineScore} ${entry.passed ? styles.scorePassed : styles.scoreFailed}`}>
              {entry.score}%
            </span>
          </div>
        )
      })}
      {!showAll && history.length > limit && (
        <button
          onClick={() => setShowAll(true)}
          className={styles.primaryButton}
          style={{ alignSelf: 'center', marginTop: 16 }}
        >
          Show all {history.length} entries
        </button>
      )}
    </div>
  )
}
