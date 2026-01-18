'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { ArrowRightIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'

interface ModuleCompleteProps {
  lessonName: string
  xpEarned?: number
  nextLessonName?: string
  autoRedirectDelay?: number // in seconds
}

// Confetti piece component
function ConfettiPiece({ index }: { index: number }) {
  // Use seeded random based on index for consistent SSR/client rendering
  const style = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000
      return x - Math.floor(x)
    }
    
    const colors = [
      '#fbbf24', // yellow
      '#f59e0b', // amber
      '#ef4444', // red
      '#ec4899', // pink
      '#8b5cf6', // purple
      '#3b82f6', // blue
      '#10b981', // emerald
      '#14b8a6', // teal
      '#f97316', // orange
      '#84cc16', // lime
    ]
    
    const color = colors[Math.floor(seededRandom(index) * colors.length)]
    const left = seededRandom(index + 1) * 100
    const delay = seededRandom(index + 2) * 3
    const duration = 3 + seededRandom(index + 3) * 2
    const size = 8 + seededRandom(index + 4) * 8
    const rotation = seededRandom(index + 5) * 360
    
    return {
      '--confetti-color': color,
      '--confetti-left': `${left}%`,
      '--confetti-delay': `${delay}s`,
      '--confetti-duration': `${duration}s`,
      '--confetti-size': `${size}px`,
      '--confetti-rotation': `${rotation}deg`,
    } as React.CSSProperties
  }, [index])
  
  return <div className={styles.confettiPiece} style={style} />
}

export default function ModuleComplete({ 
  lessonName, 
  xpEarned = 100,
  nextLessonName,
  autoRedirectDelay = 5
}: ModuleCompleteProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(autoRedirectDelay)
  
  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [router])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  // Generate confetti pieces
  const confettiPieces = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => (
      <ConfettiPiece key={i} index={i} />
    )), [])

  return (
    <div className={styles.moduleCompleteOverlay}>
      {/* Confetti container */}
      <div className={styles.confettiContainer}>
        {confettiPieces}
      </div>
      
      <div className={styles.moduleCompleteContent}>
        <span className={styles.moduleCompleteIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            {/* Star shape */}
            <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" fill="#fbbf24"/>
            {/* Inner highlight */}
            <path d="M12 5L13.45 9.47L18 10.18L14.5 13.59L15.36 18.36L12 16.27L8.64 18.36L9.5 13.59L6 10.18L10.55 9.47L12 5Z" fill="#fde047"/>
            {/* Trophy base */}
            <path d="M8 20H16V22H8V20Z" fill="#a16207"/>
            {/* Trophy stem */}
            <path d="M10 18H14V20H10V18Z" fill="#d97706"/>
          </svg>
        </span>
        
        <h1 className={styles.moduleCompleteTitle}>
          Module Complete!
        </h1>
        
        <p className={styles.moduleCompleteSubtitle}>
          Congratulations! You&apos;ve mastered <strong>{lessonName}</strong>. 
          {nextLessonName && (
            <> Your next lesson is <strong>{nextLessonName}</strong>.</>
          )}
        </p>
        
        <div className={styles.xpBadge}>
          <span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.39 8.26L21 9.27L16.5 13.97L17.78 21L12 17.77L6.22 21L7.5 13.97L3 9.27L9.61 8.26L12 2Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
            </svg>
          </span>
          <span>+{xpEarned} XP</span>
        </div>
        
        <button onClick={handleContinue} className={styles.continueBtn}>
          Return to Dashboard <ArrowRightIcon size={18} />
        </button>
        
        <p className={styles.redirectCountdown}>
          Returning to dashboard in {countdown}s...
        </p>
      </div>
    </div>
  )
}
