'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from './Write.module.css'

interface SubmitSuccessProps {
  wordCount: number
}

export default function SubmitSuccess({ wordCount }: SubmitSuccessProps) {
  const router = useRouter()

  const handleReturn = () => {
    router.push('/dashboard')
  }

  return (
    <div className={styles.successOverlay}>
      <div className={styles.successContent}>
        <span className={styles.successIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M5.5 21L4 13L9 15L11 8L14 14L19 12L17 21H5.5Z" fill="#f472b6"/>
            <circle cx="6" cy="8" r="1.5" fill="#fbbf24"/>
            <circle cx="18" cy="6" r="1" fill="#a78bfa"/>
            <circle cx="15" cy="4" r="1.5" fill="#34d399"/>
            <circle cx="9" cy="5" r="1" fill="#60a5fa"/>
            <circle cx="12" cy="3" r="1" fill="#fb923c"/>
            <path d="M3 10L5 12L4 14L2 12L3 10Z" fill="#fbbf24"/>
            <path d="M20 8L22 10L21 12L19 10L20 8Z" fill="#a78bfa"/>
            <path d="M7 3L8 5L6 6L5 4L7 3Z" fill="#34d399"/>
            <path d="M17 2L18 4L16 5L15 3L17 2Z" fill="#60a5fa"/>
            <rect x="10" y="14" width="3" height="7" rx="0.5" fill="#d946ef"/>
          </svg>
        </span>
        <h1 className={styles.successTitle}>Essay Submitted!</h1>
        <p className={styles.successSubtitle}>
          Great work! You wrote {wordCount} words. 
          Check back soon for feedback and your personalized quiz.
        </p>
        <button onClick={handleReturn} className={styles.returnBtn}>
          <ArrowLeftIcon size={18} /> Return to Dashboard
        </button>
      </div>
    </div>
  )
}

