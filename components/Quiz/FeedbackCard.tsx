'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, ArrowRightIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'

interface FeedbackCardProps {
  explanations: string[]
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
  onFinish: () => void
}

export default function FeedbackCard({ 
  explanations, 
  currentIndex,
  onNext,
  onPrevious,
  onFinish
}: FeedbackCardProps) {
  const [canContinue, setCanContinue] = useState(false)
  const [countdown, setCountdown] = useState(3)
  
  const total = explanations.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex >= total - 1
  const currentExplanation = explanations[currentIndex] || ''

  // Reset countdown when changing to a new explanation
  useEffect(() => {
    setCanContinue(false)
    setCountdown(3)
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanContinue(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentIndex])

  const handleNext = () => {
    if (!canContinue) return
    onNext()
  }

  const handleFinish = () => {
    if (!canContinue) return
    onFinish()
  }

  return (
    <div className={styles.feedbackCard}>
      <div className={styles.feedbackHeader}>
        <span className={styles.feedbackCounter}>
          Explanation {currentIndex + 1} of {total}
        </span>
        <div className={styles.feedbackNavigation}>
          <button
            className={styles.feedbackNavBtn}
            onClick={onPrevious}
            disabled={isFirst}
            aria-label="Previous explanation"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <button
            className={styles.feedbackNavBtn}
            onClick={isLast ? handleFinish : handleNext}
            disabled={!canContinue}
            aria-label={isLast ? 'Finish' : 'Next explanation'}
          >
            {canContinue ? (isLast ? <CheckIcon size={20} /> : <ChevronRightIcon size={20} />) : countdown}
          </button>
        </div>
      </div>
      
      <div className={styles.feedbackExplanation}>
        {currentExplanation}
      </div>
      
      {isLast && (
        <button 
          className={styles.continueBtn} 
          onClick={handleFinish}
          disabled={!canContinue}
          style={{ opacity: canContinue ? 1 : 0.5 }}
        >
          {canContinue ? <>Continue to Tips <ArrowRightIcon size={18} /></> : `Please read... (${countdown}s)`}
        </button>
      )}
    </div>
  )
}

