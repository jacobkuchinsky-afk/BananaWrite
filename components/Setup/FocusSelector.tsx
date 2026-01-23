'use client'

import { useState, useMemo } from 'react'
import { FOCUS_OPTIONS, FocusTopic } from '@/types'
import styles from './Setup.module.css'

interface FocusSelectorProps {
  value: FocusTopic | null
  onChange: (value: FocusTopic) => void
}

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

export default function FocusSelector({ value, onChange }: FocusSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return FOCUS_OPTIONS
    }
    const query = searchQuery.toLowerCase().trim()
    return FOCUS_OPTIONS.filter(option => 
      option.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Check if the current value is a custom topic (not in the predefined list)
  const isCustomTopicSelected = value && !FOCUS_OPTIONS.includes(value as typeof FOCUS_OPTIONS[number])

  const handleValidateTopic = async () => {
    const trimmedTopic = customTopic.trim()
    if (!trimmedTopic) return

    setValidationState('validating')
    setValidationError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/validate-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: trimmedTopic }),
      })

      const data = await response.json()

      if (data.valid) {
        setValidationState('success')
        // Auto-select the custom topic after a brief delay to show the checkmark
        setTimeout(() => {
          onChange(trimmedTopic)
          setValidationState('idle')
          setCustomTopic('')
        }, 800)
      } else {
        setValidationState('error')
        setValidationError(data.feedback || 'This topic is not valid. Please try a different one.')
      }
    } catch (error) {
      console.error('Error validating topic:', error)
      setValidationState('error')
      setValidationError('Failed to validate topic. Please try again.')
    }
  }

  const handleCustomTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTopic.trim() && validationState !== 'validating') {
      e.preventDefault()
      handleValidateTopic()
    }
  }

  return (
    <div className={styles.focusContainer}>
      <div className={styles.searchWrapper}>
        <svg
          className={styles.searchIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.focusGrid}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.focusOption} ${value === option ? styles.selected : ''}`}
              onClick={() => onChange(option)}
            >
              {option}
            </button>
          ))
        ) : (
          <div className={styles.noResults}>
            No topics found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Custom Topic Section */}
      <div className={styles.customTopicSection}>
        <div className={styles.customTopicDivider}>
          <span>or enter your own</span>
        </div>
        
        <div className={styles.customTopicInputWrapper}>
          <input
            type="text"
            className={`${styles.customTopicInput} ${validationState === 'error' ? styles.customTopicInputError : ''} ${validationState === 'success' ? styles.customTopicInputSuccess : ''}`}
            placeholder="Enter a custom topic..."
            value={customTopic}
            onChange={(e) => {
              setCustomTopic(e.target.value)
              if (validationState === 'error') {
                setValidationState('idle')
                setValidationError(null)
              }
            }}
            onKeyDown={handleCustomTopicKeyDown}
            disabled={validationState === 'validating' || validationState === 'success'}
          />
          <button
            type="button"
            className={`${styles.addTopicButton} ${validationState === 'success' ? styles.addTopicButtonSuccess : ''}`}
            onClick={handleValidateTopic}
            disabled={!customTopic.trim() || validationState === 'validating' || validationState === 'success'}
          >
            {validationState === 'validating' ? (
              <span className={styles.buttonSpinner} />
            ) : validationState === 'success' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              'Add Topic'
            )}
          </button>
        </div>

        {/* Error feedback */}
        {validationState === 'error' && validationError && (
          <div className={styles.validationErrorBox}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{validationError}</p>
          </div>
        )}

        {/* Show selected custom topic */}
        {isCustomTopicSelected && (
          <div className={styles.selectedCustomTopic}>
            <span>Selected custom topic:</span>
            <strong>{value}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
