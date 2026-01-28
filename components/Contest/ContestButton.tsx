'use client'

import { useState } from 'react'
import styles from './Contest.module.css'
import { saveBugReport } from '@/lib/adminFirestore'
import { BugReportContextType } from '@/types'

const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

type ContestState = 'idle' | 'loading' | 'success' | 'failure'

// Game controller icon for loading game button
const GameIcon = () => (
  <svg className={styles.contestBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <line x1="16" y1="10" x2="16" y2="14" />
    <line x1="14" y1="12" x2="18" y2="12" />
  </svg>
)

interface ContestButtonProps {
  contextType: BugReportContextType
  originalResponse: string
  userContent: string
  originalPrompt?: string  // Required for essay_check context
  onContestSuccess: (correctionFeedback: string) => void
  onContestConfirmed: () => void  // Called when AI confirms it was correct
  disabled?: boolean
  // User info for bug reports
  userId?: string
  userEmail?: string
  displayName?: string | null
  // Loading game props
  onShowLoadingGame?: () => void  // Called when user clicks "Go play loading game"
  onLoadingComplete?: () => void  // Called when self-review finishes
}

// Checkmark SVG icon
const CheckmarkIcon = () => (
  <svg className={styles.checkmark} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// X SVG icon
const XmarkIcon = () => (
  <svg className={styles.xmark} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Alert icon for button
const AlertIcon = () => (
  <svg className={styles.contestBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

// Checkmark icon for confirmed button state
const CheckIcon = () => (
  <svg className={styles.contestBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function ContestButton({
  contextType,
  originalResponse,
  userContent,
  originalPrompt,
  onContestSuccess,
  onContestConfirmed,
  disabled = false,
  userId,
  userEmail,
  displayName,
  onShowLoadingGame,
  onLoadingComplete
}: ContestButtonProps) {
  const [state, setState] = useState<ContestState>('idle')
  const [showResultBox, setShowResultBox] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Handle the contest action
  const handleContest = async () => {
    if (disabled || state === 'loading' || isConfirmed) return

    setState('loading')
    setShowResultBox(true)

    try {
      const response = await fetch(`${FLASK_API_URL}/api/self-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_type: contextType,
          original_response: originalResponse,
          user_content: userContent,
          original_prompt: originalPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit contest')
      }

      const result = await response.json()

      // Save bug report to Firestore (fire-and-forget, don't block UI)
      if (userId && userEmail) {
        saveBugReport({
          userId,
          userEmail,
          displayName: displayName || null,
          contextType,
          originalResponse,
          userContent,
          originalPrompt,
          selfReviewResult: {
            isCorrect: result.is_correct,
            correctionFeedback: result.correction_feedback || null,
            rawResponse: result.raw_response || ''
          }
        }).catch(reportError => {
          console.error('Failed to save bug report:', reportError)
        })
      } else {
        console.warn('Bug report not saved: missing userId or userEmail', { userId: !!userId, userEmail: !!userEmail, contextType })
      }

      if (result.is_correct) {
        // AI was correct - show checkmark and disable button
        setState('success')
        onLoadingComplete?.()  // Notify that loading is complete
        
        // Wait 2 seconds, then fade out and mark as confirmed
        setTimeout(() => {
          setShowResultBox(false)
          setIsConfirmed(true)
          onContestConfirmed()
        }, 2000)
      } else {
        // AI was wrong - show X and trigger re-evaluation
        setState('failure')
        onLoadingComplete?.()  // Notify that loading is complete
        
        // Wait 1 second, then trigger the callback
        setTimeout(() => {
          setShowResultBox(false)
          setState('idle')
          onContestSuccess(result.correction_feedback || '')
        }, 1000)
      }
    } catch (error) {
      console.error('Contest error:', error)
      setState('idle')
      setShowResultBox(false)
      onLoadingComplete?.()  // Notify that loading is complete even on error
    }
  }

  // Get button text based on state
  const getButtonText = () => {
    if (isConfirmed) return 'Confirmed'
    if (state === 'loading') return 'Checking...'
    return 'I think this is wrong'
  }

  // Get button icon
  const getButtonIcon = () => {
    if (isConfirmed) return <CheckIcon />
    return <AlertIcon />
  }

  // Determine button classes
  const buttonClasses = [
    styles.contestBtn,
    state === 'loading' ? styles.loading : '',
    isConfirmed ? styles.confirmed : ''
  ].filter(Boolean).join(' ')

  // Determine result box classes
  const resultBoxClasses = [
    styles.resultBox,
    state === 'success' ? styles.success : '',
    state === 'failure' ? styles.failure : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.contestContainer}>
      {/* Result box - appears above button when active */}
      {showResultBox && (
        <div className={resultBoxClasses}>
          {state === 'loading' && <div className={styles.spinner} />}
          {state === 'success' && <CheckmarkIcon />}
          {state === 'failure' && <XmarkIcon />}
        </div>
      )}

      {/* The contest button with tooltip */}
      <div className={styles.buttonWrapper}>
        <button
          className={buttonClasses}
          onClick={handleContest}
          disabled={disabled || state === 'loading' || isConfirmed}
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
        {!isConfirmed && state !== 'loading' && (
          <div className={styles.tooltip}>
            Clicking this button will send a bug report and employ another AI to verify and try to fix the problem ~1 minute to fix
          </div>
        )}
      </div>

      {/* Go play loading game button - appears when review is in progress */}
      {state === 'loading' && onShowLoadingGame && (
        <button
          className={styles.loadingGameBtn}
          onClick={onShowLoadingGame}
        >
          <GameIcon />
          Go play loading game
        </button>
      )}
    </div>
  )
}
