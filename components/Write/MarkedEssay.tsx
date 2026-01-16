'use client'

import styles from './Write.module.css'

interface MarkedEssayProps {
  markedEssay: string
  errors: string[]
  problemCount: number
  canRedo: boolean
  onContinue: () => void
  onRedo?: () => void
}

/**
 * Component that displays an essay with errors highlighted in red.
 * The marked essay uses ¦ character to surround error portions.
 * Example: "This is correct ¦error part¦ more correct text"
 */
export default function MarkedEssay({ 
  markedEssay, 
  errors, 
  problemCount,
  canRedo,
  onContinue,
  onRedo 
}: MarkedEssayProps) {
  // Parse the marked essay - split by ¦ to get alternating normal/error segments
  const parseMarkedEssay = (text: string) => {
    // Split by the error marker character ¦
    const segments = text.split('¦')
    
    // The pattern is: normal text, error, normal text, error, ...
    // So odd-indexed segments (1, 3, 5...) are errors
    return segments.map((segment, index) => ({
      text: segment,
      isError: index % 2 === 1 // Odd indices are errors
    }))
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

  // User can fix errors if there are 2 or fewer problems and they haven't used their redo chance
  const showRedoOption = canRedo && problemCount <= 2 && onRedo

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
            {parsedSegments.map((segment, index) => (
              segment.isError ? (
                <span key={index} className={styles.errorHighlight}>
                  {segment.text}
                </span>
              ) : (
                <span key={index}>{segment.text}</span>
              )
            ))}
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
        </div>
      </div>
    </div>
  )
}

