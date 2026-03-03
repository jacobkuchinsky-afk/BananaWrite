'use client'

import styles from './Write.module.css'
import { ContestButton } from '@/components/Contest'

interface MarkedEssayProps {
  markedEssay: string
  errors: string[]
  problemCount: number
  canRedo: boolean
  maxErrorsForRedo?: number
  onContinue: () => void
  onRedo?: () => void
  // Contest props
  essayText?: string
  essayReviewResponse?: string | null
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

/**
 * Component that displays an essay with errors highlighted in red.
 * The marked essay uses ¦ character to surround error portions.
 * Double markers ¦¦text¦¦ indicate above-level observations (not counted as errors).
 * Example: "This is correct ¦error part¦ more correct text ¦¦above-level¦¦"
 */
export default function MarkedEssay({ 
  markedEssay, 
  errors, 
  problemCount,
  canRedo,
  maxErrorsForRedo = 2,
  onContinue,
  onRedo,
  // Contest props
  essayText,
  essayReviewResponse,
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
}: MarkedEssayProps) {
  type SegmentType = 'normal' | 'error' | 'above_level'
  
  const parseMarkedEssay = (text: string): { text: string; type: SegmentType }[] => {
    const result: { text: string; type: SegmentType }[] = []
    let remaining = text
    
    while (remaining.length > 0) {
      // Check for double marker (above-level) first
      const doubleStart = remaining.indexOf('¦¦')
      const singleStart = remaining.indexOf('¦')
      
      if (doubleStart !== -1 && (singleStart === -1 || doubleStart <= singleStart)) {
        // Found double marker — push text before it
        if (doubleStart > 0) {
          result.push({ text: remaining.slice(0, doubleStart), type: 'normal' })
        }
        const afterOpen = remaining.slice(doubleStart + 2)
        const doubleEnd = afterOpen.indexOf('¦¦')
        if (doubleEnd !== -1) {
          result.push({ text: afterOpen.slice(0, doubleEnd), type: 'above_level' })
          remaining = afterOpen.slice(doubleEnd + 2)
        } else {
          // No closing double marker, treat rest as normal
          result.push({ text: remaining.slice(doubleStart), type: 'normal' })
          remaining = ''
        }
      } else if (singleStart !== -1) {
        // Found single marker (in-scope error)
        if (singleStart > 0) {
          result.push({ text: remaining.slice(0, singleStart), type: 'normal' })
        }
        const afterOpen = remaining.slice(singleStart + 1)
        const singleEnd = afterOpen.indexOf('¦')
        if (singleEnd !== -1) {
          result.push({ text: afterOpen.slice(0, singleEnd), type: 'error' })
          remaining = afterOpen.slice(singleEnd + 1)
        } else {
          result.push({ text: remaining.slice(singleStart), type: 'normal' })
          remaining = ''
        }
      } else {
        // No more markers
        result.push({ text: remaining, type: 'normal' })
        remaining = ''
      }
    }
    
    return result.filter(s => s.text.length > 0)
  }

  const parsedSegments = parseMarkedEssay(markedEssay)

  // Parse error list to show severity
  const parseErrors = (errorList: string[]) => {
    return errorList.map(error => {
      if (error.includes('~')) {
        const parts = error.split('~')
        return {
          description: parts[0].trim(),
          severity: parseInt(parts[1]?.trim() || '5', 10)
        }
      }
      return { description: error, severity: 5 }
    })
  }

  const parsedErrors = parseErrors(errors)

  // User can fix errors if there are errors within threshold and they haven't used their redo chance
  const showRedoOption = canRedo && problemCount <= maxErrorsForRedo && onRedo

  return (
    <div className={styles.markedEssayOverlay}>
      <div className={styles.markedEssayContainer}>
        <div className={styles.markedEssayHeader}>
          <h2 className={styles.markedEssayTitle}>Essay Review</h2>
          <p className={styles.markedEssaySubtitle}>
            We found some areas to improve. Errors are highlighted in red below.
          </p>
        </div>

        {/* Error Summary */}
        {parsedErrors.length > 0 && (
          <div className={styles.errorSummary}>
            <h3 className={styles.errorSummaryTitle}>Issues Found ({problemCount}):</h3>
            <ul className={styles.errorList}>
              {parsedErrors.map((error, index) => (
                <li key={index} className={styles.errorItem}>
                  <span 
                    className={styles.errorSeverity}
                    data-severity={error.severity >= 7 ? 'high' : error.severity >= 4 ? 'medium' : 'low'}
                  >
                    {error.severity}/10
                  </span>
                  <span className={styles.errorDescription}>{error.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Marked Essay Display */}
        <div className={styles.markedEssayContent}>
          <p className={styles.markedEssayText}>
            {parsedSegments.map((segment, index) => {
              if (segment.type === 'error') {
                return (
                  <span key={index} className={styles.errorHighlight}>
                    {segment.text}
                  </span>
                )
              }
              if (segment.type === 'above_level') {
                return (
                  <span
                    key={index}
                    className={styles.aboveLevelHighlight}
                    title="This is above your current level — it won't count against you"
                  >
                    {segment.text}
                  </span>
                )
              }
              return <span key={index}>{segment.text}</span>
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.markedEssayActions}>
          {showRedoOption ? (
            <>
              <p className={styles.continueHint}>
                You have a few errors. Would you like to fix them, or continue to the quiz?
              </p>
              <div className={styles.actionButtonGroup}>
                <button onClick={onRedo} className={styles.redoBtn}>
                  Fix Errors
                </button>
                <button onClick={onContinue} className={styles.continueBtn}>
                  Continue to Quiz
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.continueHint}>
                Continue to take a quiz and master these concepts!
              </p>
              <button onClick={onContinue} className={styles.continueBtn}>
                Continue to Quiz
              </button>
            </>
          )}
          
          {/* Contest button for essay review */}
          {essayText && essayReviewResponse && onContestSuccess && onContestConfirmed && userId && userEmail && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <ContestButton
                contextType="essay_review"
                originalResponse={essayReviewResponse}
                userContent={essayText}
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
      </div>
    </div>
  )
}

