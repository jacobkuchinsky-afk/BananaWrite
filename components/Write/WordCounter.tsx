'use client'

import styles from './Write.module.css'

interface WordCounterProps {
  wordCount: number
  targetWords?: number
  maxWords?: number
}

export default function WordCounter({ 
  wordCount, 
  targetWords = 300,
  maxWords = 500
}: WordCounterProps) {
  const percentage = Math.min((wordCount / targetWords) * 100, 100)
  const isComplete = wordCount >= targetWords
  const isWarning = wordCount >= targetWords * 0.8 && !isComplete
  const isOver = wordCount > maxWords

  // Determine status class
  const getStatusClass = () => {
    if (isOver) return styles.over
    if (isComplete) return styles.complete
    if (isWarning) return styles.warning
    return ''
  }

  // Words remaining/over message
  const getWordsMessage = () => {
    if (wordCount < targetWords) {
      const remaining = targetWords - wordCount
      return `${remaining} more word${remaining !== 1 ? 's' : ''} needed`
    } else if (wordCount <= maxWords) {
      return 'Minimum reached'
    } else {
      const over = wordCount - maxWords
      return `${over} words over suggested maximum`
    }
  }

  return (
    <div className={styles.wordCounterSection}>
      <div className={styles.wordCounterHeader}>
        <span className={`${styles.wordCount} ${getStatusClass()}`}>
          {wordCount}/{targetWords} words
        </span>
        <span className={styles.wordCountPercent}>
          {getWordsMessage()}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressBarFill} ${getStatusClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}


