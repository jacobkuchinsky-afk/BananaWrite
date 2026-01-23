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
  onAskTeacher?: () => void
}

// Parse explanation text into formatted sections
function formatExplanation(text: string) {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  
  if (paragraphs.length <= 1) {
    // Try splitting by single newlines if no double newlines
    const lines = text.split(/\n/).filter(l => l.trim())
    if (lines.length > 1) {
      return lines
    }
    // Try splitting by periods followed by space and capital letter for long single blocks
    if (text.length > 200) {
      const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.trim())
      // Group sentences into chunks of 2-3 for better readability
      const chunks: string[] = []
      for (let i = 0; i < sentences.length; i += 2) {
        chunks.push(sentences.slice(i, i + 2).join(' '))
      }
      return chunks.length > 1 ? chunks : [text]
    }
  }
  
  return paragraphs
}

export default function FeedbackCard({ 
  explanations, 
  currentIndex,
  onNext,
  onPrevious,
  onFinish,
  onAskTeacher
}: FeedbackCardProps) {
  const [canContinue, setCanContinue] = useState(false)
  const [countdown, setCountdown] = useState(3)
  
  const total = explanations.length
  const isFirst = currentIndex === 0
  const isLast = currentIndex >= total - 1
  const currentExplanation = explanations[currentIndex] || ''
  const formattedParagraphs = formatExplanation(currentExplanation)

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
        <div className={styles.feedbackHeaderLeft}>
          <span className={styles.feedbackBadge}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Why you got it wrong
          </span>
          <span className={styles.feedbackCounter}>
            {currentIndex + 1} of {total}
          </span>
        </div>
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
        {formattedParagraphs.map((paragraph, idx) => (
          <p key={idx} className={styles.feedbackParagraph}>
            {paragraph}
          </p>
        ))}
      </div>
      
      {onAskTeacher && (
        <div className={styles.stillConfusedSection}>
          <span className={styles.stillConfusedText}>Still confused?</span>
          <button 
            className={styles.stillConfusedBtn}
            onClick={onAskTeacher}
          >
            Ask AI Teacher
          </button>
        </div>
      )}
      
      <div className={styles.feedbackProgress}>
        {Array.from({ length: total }).map((_, idx) => (
          <div 
            key={idx} 
            className={`${styles.feedbackProgressDot} ${idx === currentIndex ? styles.active : ''} ${idx < currentIndex ? styles.completed : ''}`}
          />
        ))}
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

