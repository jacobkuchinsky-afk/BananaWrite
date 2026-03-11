'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './Quiz.module.css'

interface QuizQuestionProps {
  questionNumber: number
  questionText: string
  questionType: string  // 'A,B,C,D' | 'Fill in the blank' | 'type out an answer'
  onAnswer: (answer: string) => void
  onReport?: () => Promise<void>
  disabled?: boolean
  isReporting?: boolean
}

interface ParsedQuestion {
  type: 'multiple_choice' | 'fill_blank' | 'text_answer'
  questionText: string
  options: string[]  // For multiple choice, contains the option texts
}

// Parse question using the new tag format
function parseQuestionWithTags(text: string): ParsedQuestion {
  // Check for <MULTI> tags - Multiple Choice
  const multiPattern = /<MULTI>([^<]+)<\/MULTI>/gi
  const multiMatches = [...text.matchAll(multiPattern)]
  
  if (multiMatches.length >= 2) {
    const options: string[] = []
    for (const match of multiMatches) {
      // Extract the option text, removing the letter prefix (A., B., etc.)
      let optionText = match[1].trim()
      // Remove leading letter and punctuation like "A. " or "A) "
      optionText = optionText.replace(/^[A-D][.):\s]+/i, '').trim()
      options.push(optionText)
    }
    // Get the question text (everything before the first <MULTI> tag)
    const questionText = text.split(/<MULTI>/i)[0].trim()
    return {
      type: 'multiple_choice',
      questionText,
      options
    }
  }
  
  // Check for <FILL> tags - Fill in the blank
  const fillPattern = /<FILL>([^<]+)<\/FILL>/gi
  const fillMatch = fillPattern.exec(text)
  
  if (fillMatch) {
    return {
      type: 'fill_blank',
      questionText: fillMatch[1].trim(),
      options: []
    }
  }
  
  // Check for <TYPE> tags - Type out answer
  const typePattern = /<TYPE>([^<]+)<\/TYPE>/gi
  const typeMatch = typePattern.exec(text)
  
  if (typeMatch) {
    return {
      type: 'text_answer',
      questionText: typeMatch[1].trim(),
      options: []
    }
  }
  
  // Fallback: Try legacy parsing for old format questions
  return parseLegacyQuestion(text)
}

// Legacy parsing for questions without the new tags
function parseLegacyQuestion(text: string): ParsedQuestion {
  const options: string[] = []
  
  // Try to find A) B) C) D) or A. B. C. D. patterns
  const patterns = [
    /<MULTI>([^<]+)<\/MULTI>/gi,  // New format (already checked, but just in case)
    /([A-D])\.\s*([^\n<]+?)(?=\n[A-D]\.|$|<)/gi,  // A. format
    /([A-D])\)\s*([^\n<]+?)(?=\n[A-D]\)|$|<)/gi,  // A) format
  ]
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)]
    if (matches.length >= 2) {
      for (const match of matches) {
        options.push(match[2]?.trim() || match[1]?.trim())
      }
      const questionText = text.split(/[A-D][.)]/)[0].trim()
      return {
        type: 'multiple_choice',
        questionText,
        options
      }
    }
  }
  
  // Check for fill in the blank indicators
  const lowerText = text.toLowerCase()
  if (lowerText.includes('fill in') || lowerText.includes('___') || 
      lowerText.includes('type the punctuation') || lowerText.includes('type in the')) {
    return {
      type: 'fill_blank',
      questionText: text,
      options: []
    }
  }
  
  // Default to text answer
  return {
    type: 'text_answer',
    questionText: text,
    options: []
  }
}

const FlagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)

export default function QuizQuestion({ 
  questionNumber, 
  questionText, 
  questionType,
  onAnswer,
  onReport,
  disabled = false,
  isReporting = false
}: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  
  // Parse the question using new tag format
  const parsedQuestion = useMemo(() => 
    parseQuestionWithTags(questionText), 
    [questionText]
  )
  
  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null)
    setTextAnswer('')
  }, [questionNumber, questionText])
  
  const handleOptionSelect = (index: number) => {
    if (disabled) return
    setSelectedOption(index)
  }
  
  const handleSubmit = () => {
    if (disabled) return
    
    if (parsedQuestion.type === 'multiple_choice' && selectedOption !== null) {
      // Return the letter (A, B, C, D)
      const letter = String.fromCharCode(65 + selectedOption)
      onAnswer(letter)
    } else if (textAnswer.trim()) {
      onAnswer(textAnswer.trim())
    }
  }
  
  // canSubmit checks based on what UI is actually shown
  const canSubmit = parsedQuestion.type === 'multiple_choice' 
    ? selectedOption !== null 
    : textAnswer.trim().length > 0

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionNumber}>Question {questionNumber}</div>
      <div className={styles.questionText}>
        {parsedQuestion.questionText}
      </div>
      
      {parsedQuestion.type === 'multiple_choice' && parsedQuestion.options.length > 0 ? (
        <div className={styles.optionsContainer}>
          {parsedQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`${styles.optionButton} ${selectedOption === index ? styles.selected : ''}`}
              onClick={() => handleOptionSelect(index)}
              disabled={disabled}
            >
              <span className={styles.optionLetter}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className={styles.optionText}>{option}</span>
            </button>
          ))}
        </div>
      ) : parsedQuestion.type === 'fill_blank' ? (
        <div className={styles.answerInputContainer}>
          <input
            type="text"
            className={styles.answerInput}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={disabled}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
          />
        </div>
      ) : (
        <div className={styles.answerInputContainer}>
          <textarea
            className={`${styles.answerInput} ${styles.answerTextarea}`}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={disabled}
          />
        </div>
      )}
      
      <div className={styles.submitSection}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={disabled || !canSubmit || isReporting}
        >
          {disabled ? 'Submitting...' : 'Submit Answer'}
        </button>
        {onReport && (
          <button
            className={styles.reportBtn}
            onClick={onReport}
            disabled={disabled || isReporting}
          >
            <FlagIcon />
            {isReporting ? 'Replacing question...' : 'Report Question'}
          </button>
        )}
      </div>
    </div>
  )
}
