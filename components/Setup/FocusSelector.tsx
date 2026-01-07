'use client'

import { useState, useMemo } from 'react'
import { FOCUS_OPTIONS, FocusTopic } from '@/types'
import styles from './Setup.module.css'

interface FocusSelectorProps {
  value: FocusTopic | null
  onChange: (value: FocusTopic) => void
}

export default function FocusSelector({ value, onChange }: FocusSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return FOCUS_OPTIONS
    }
    const query = searchQuery.toLowerCase().trim()
    return FOCUS_OPTIONS.filter(option => 
      option.toLowerCase().includes(query)
    )
  }, [searchQuery])

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
    </div>
  )
}


