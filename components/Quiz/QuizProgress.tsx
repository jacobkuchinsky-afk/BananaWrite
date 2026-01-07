'use client'

import styles from './Quiz.module.css'

interface QuizProgressProps {
  current: number
  total: number
  quizName?: string
}

export default function QuizProgress({ current, total, quizName }: QuizProgressProps) {
  const percent = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>
          {quizName || 'Quiz Progress'}
        </span>
        <span className={styles.progressCount}>
          {current} of {total}
        </span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}


