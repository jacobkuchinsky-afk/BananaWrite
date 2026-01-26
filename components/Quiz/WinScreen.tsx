'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { ArrowRightIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'
import trophyImage from '@/assets/trophy.png'

interface WinScreenProps {
  variant: 'perfect_essay' | 'quizzes_complete'
  xpEarned?: number
  lessonName?: string // For perfect essay
  learnedTopics?: string[] // For quizzes complete
  autoRedirectDelay?: number // in seconds
}

// Confetti cannon piece component
function ConfettiCannonPiece({ index, side }: { index: number; side: 'left' | 'right' }) {
  const style = useMemo(() => {
    // Seeded random for consistent SSR/client rendering
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000
      return x - Math.floor(x)
    }
    
    // Green/white color palette
    const colors = [
      '#16a34a', // forest green
      '#22c55e', // green
      '#4ade80', // light green
      '#86efac', // mint
      '#ffffff', // white
      '#dcfce7', // pale green
      '#bbf7d0', // light mint
      '#15803d', // dark green
      '#a7f3d0', // seafoam
      '#34d399', // emerald
    ]
    
    const color = colors[Math.floor(seededRandom(index) * colors.length)]
    const delay = seededRandom(index + 1) * 0.5 // 0-0.5s staggered delay
    const duration = 1.2 + seededRandom(index + 2) * 0.8 // 1.2-2s duration
    const size = 8 + seededRandom(index + 3) * 10 // 8-18px
    const rotation = seededRandom(index + 4) * 360
    
    // Trajectory calculations - shoot upward and outward
    const angle = side === 'left' 
      ? 30 + seededRandom(index + 5) * 60  // 30-90 degrees for left cannon
      : 90 + seededRandom(index + 5) * 60  // 90-150 degrees for right cannon
    
    const velocity = 400 + seededRandom(index + 6) * 400 // 400-800px travel distance
    const angleRad = (angle * Math.PI) / 180
    const endX = Math.cos(angleRad) * velocity
    const endY = -Math.sin(angleRad) * velocity // negative because up is negative Y
    
    return {
      '--confetti-color': color,
      '--confetti-delay': `${delay}s`,
      '--confetti-duration': `${duration}s`,
      '--confetti-size': `${size}px`,
      '--confetti-rotation': `${rotation}deg`,
      '--confetti-end-x': `${endX}px`,
      '--confetti-end-y': `${endY}px`,
      '--confetti-side': side,
    } as React.CSSProperties
  }, [index, side])
  
  return (
    <div 
      className={`${styles.confettiCannonPiece} ${side === 'left' ? styles.leftCannon : styles.rightCannon}`} 
      style={style} 
    />
  )
}

export default function WinScreen({ 
  variant,
  xpEarned = 100,
  lessonName,
  learnedTopics,
  autoRedirectDelay = 5
}: WinScreenProps) {
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

  // Generate confetti cannon pieces - 30 from each corner
  const confettiPieces = useMemo(() => {
    const pieces = []
    for (let i = 0; i < 35; i++) {
      pieces.push(<ConfettiCannonPiece key={`left-${i}`} index={i} side="left" />)
      pieces.push(<ConfettiCannonPiece key={`right-${i}`} index={i + 35} side="right" />)
    }
    return pieces
  }, [])

  // Dynamic content based on variant
  const title = variant === 'perfect_essay' 
    ? 'Perfect Essay!' 
    : 'Victory!'
  
  const subtitle = variant === 'perfect_essay'
    ? (
        <>
          Incredible! Your essay on <strong>{lessonName || 'writing'}</strong> had no errors. 
          You&apos;ve truly mastered this skill!
        </>
      )
    : (
        <>
          Congratulations! You&apos;ve learned from all your mistakes and mastered 
          {learnedTopics && learnedTopics.length > 0 && (
            <> <strong>{learnedTopics.length}</strong> topic{learnedTopics.length > 1 ? 's' : ''}</>
          )}!
        </>
      )

  return (
    <div className={styles.winScreenOverlay}>
      {/* Confetti cannon containers */}
      <div className={styles.confettiCannonContainer}>
        {confettiPieces}
      </div>
      
      <div className={styles.winScreenContent}>
        {/* Trophy Icon */}
        <span className={styles.winScreenIcon}>
          <Image
            src={trophyImage}
            alt="Trophy"
            width={80}
            height={80}
            style={{ objectFit: 'contain' }}
            priority
          />
        </span>
        
        <h1 className={styles.winScreenTitle}>
          {title}
        </h1>
        
        <p className={styles.winScreenSubtitle}>
          {subtitle}
        </p>
        
        {/* XP Badge */}
        <div className={styles.winXpBadge}>
          <span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.39 8.26L21 9.27L16.5 13.97L17.78 21L12 17.77L6.22 21L7.5 13.97L3 9.27L9.61 8.26L12 2Z" fill="#16a34a" stroke="#15803d" strokeWidth="1"/>
            </svg>
          </span>
          <span>+{xpEarned} XP</span>
        </div>
        
        <button onClick={handleContinue} className={styles.winContinueBtn}>
          Return to Dashboard <ArrowRightIcon size={18} />
        </button>
        
        <p className={styles.winRedirectCountdown}>
          Returning to dashboard in {countdown}s...
        </p>
      </div>
    </div>
  )
}

