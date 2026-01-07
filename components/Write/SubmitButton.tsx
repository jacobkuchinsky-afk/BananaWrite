'use client'

import styles from './Write.module.css'

interface SubmitButtonProps {
  wordCount: number
  targetWords?: number
  onSubmit: () => void
  disabled?: boolean
  loading?: boolean
}

export default function SubmitButton({ 
  wordCount, 
  targetWords = 300,
  onSubmit,
  disabled = false,
  loading = false
}: SubmitButtonProps) {
  const canSubmit = wordCount >= targetWords && !disabled && !loading
  const wordsNeeded = Math.max(0, targetWords - wordCount)

  const handleClick = () => {
    if (canSubmit) {
      onSubmit()
    }
  }

  // Determine button text
  const getButtonText = () => {
    if (loading) return 'Checking Essay...'
    return 'Submit Essay'
  }

  return (
    <div className={styles.submitSection}>
      <button
        className={styles.submitBtn}
        onClick={handleClick}
        disabled={!canSubmit}
      >
        {getButtonText()}
      </button>
      {!canSubmit && !loading && wordsNeeded > 0 && (
        <p className={styles.submitHint}>
          Write {wordsNeeded} more word{wordsNeeded !== 1 ? 's' : ''} to submit
        </p>
      )}
    </div>
  )
}

