'use client'

import { ArrowRightIcon, CheckIcon } from '@/components/Icons/Icons'
import { ContestButton } from '@/components/Contest'
import styles from './Quiz.module.css'

interface QuizResultsProps {
  score: number
  passed: boolean
  feedback: string
  onContinue: () => void
  continueLabel?: string
  // Contest props
  formattedAnswers?: string
  onContestSuccess?: (correctionFeedback: string) => void
  onContestConfirmed?: () => void
  contestConfirmed?: boolean
  // User info for bug reports
  userId?: string
  userEmail?: string
  displayName?: string | null
  // Loading game props
  onShowLoadingGame?: () => void
  onLoadingComplete?: () => void
}

// Parse feedback into structured sections
function parseFeedback(feedback: string) {
  // Split by common patterns like "Question 1:", "Q1:", numbered items, etc.
  const lines = feedback.split('\n').filter(line => line.trim())
  
  const sections: { type: 'correct' | 'incorrect' | 'info'; content: string }[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect correct answers - look for "check" or checkmark symbols
    if (trimmed.toLowerCase().includes('check') || trimmed.includes('✓') || trimmed.includes('✔')) {
      sections.push({ type: 'correct', content: trimmed })
    }
    // Detect incorrect answers - look for "x" or X symbols
    else if (trimmed.toLowerCase().includes(' x ') || trimmed.includes('✗') || trimmed.includes('✘') || trimmed.includes('❌') || /\bx\b/i.test(trimmed)) {
      sections.push({ type: 'incorrect', content: trimmed })
    }
    // General info
    else if (trimmed.length > 0) {
      sections.push({ type: 'info', content: trimmed })
    }
  }
  
  return sections.length > 0 ? sections : [{ type: 'info' as const, content: feedback }]
}

export default function QuizResults({ 
  score, 
  passed, 
  feedback,
  onContinue,
  continueLabel = 'Continue',
  // Contest props
  formattedAnswers,
  onContestSuccess,
  onContestConfirmed,
  contestConfirmed = false,
  // User info for bug reports
  userId,
  userEmail,
  displayName,
  // Loading game props
  onShowLoadingGame,
  onLoadingComplete
}: QuizResultsProps) {
  const feedbackSections = parseFeedback(feedback)
  
  return (
    <div className={styles.resultsCard}>
      <div className={`${styles.scoreCircle} ${passed ? styles.passed : styles.failed}`}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreLabel}>percent</span>
      </div>
      
      <h2 className={`${styles.resultsTitle} ${passed ? styles.passed : styles.failed}`}>
        {passed ? 'Great Job!' : 'Keep Practicing!'}
      </h2>
      
      <p className={styles.resultsSubtitle}>
        {passed 
          ? 'You passed this quiz! Your understanding is improving.'
          : 'You need 75% to pass. Let\'s review what you got wrong.'}
      </p>
      
      {feedback && (
        <div className={styles.resultsFeedback}>
          <h3 className={styles.feedbackTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Your Results
          </h3>
          <div className={styles.feedbackSections}>
            {feedbackSections.map((section, index) => (
              <div 
                key={index} 
                className={`${styles.feedbackSection} ${styles[section.type]}`}
              >
                <span className={styles.feedbackIcon}>
                  {section.type === 'correct' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {section.type === 'incorrect' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                  {section.type === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="8" />
                    </svg>
                  )}
                </span>
                <p className={styles.feedbackContent}>{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button className={styles.continueBtn} onClick={onContinue}>
        {continueLabel} <ArrowRightIcon size={18} />
      </button>
      
      {/* Contest button for quiz grading */}
      {onContestSuccess && onContestConfirmed && userId && userEmail && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <ContestButton
            contextType="quiz_grade"
            originalResponse={feedback}
            userContent={formattedAnswers || 'No answer data available'}
            onContestSuccess={onContestSuccess}
            onContestConfirmed={onContestConfirmed}
            disabled={contestConfirmed}
            userId={userId}
            userEmail={userEmail}
            displayName={displayName}
            onShowLoadingGame={onShowLoadingGame}
            onLoadingComplete={onLoadingComplete}
          />
        </div>
      )}
    </div>
  )
}

