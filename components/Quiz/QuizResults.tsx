'use client'

import { ArrowRightIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'

interface QuizResultsProps {
  score: number
  passed: boolean
  feedback: string
  onContinue: () => void
  continueLabel?: string
}

export default function QuizResults({ 
  score, 
  passed, 
  feedback,
  onContinue,
  continueLabel = 'Continue'
}: QuizResultsProps) {
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
          <h3 className={styles.feedbackTitle}>Quiz Results</h3>
          <p className={styles.feedbackText}>{feedback}</p>
        </div>
      )}
      
      <button className={styles.continueBtn} onClick={onContinue}>
        {continueLabel} <ArrowRightIcon size={18} />
      </button>
    </div>
  )
}

