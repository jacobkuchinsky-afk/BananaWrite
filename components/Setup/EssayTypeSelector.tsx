'use client'

import { ESSAY_TYPE_OPTIONS, EssayType } from '@/types'
import styles from './Setup.module.css'

interface EssayTypeSelectorProps {
  value: EssayType | null
  onChange: (value: EssayType) => void
}

// Icons for each essay type
function FictionIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Quill feather - creative writing symbol */}
      <path d="M20 2c-2 0-4 1-5.5 2.5S12 8 12 10c0 1.5.5 3 1.5 4" />
      <path d="M20 2c0 2-1 4-2.5 5.5S14 10 12 10" />
      <path d="M13.5 14L4 22" />
      <path d="M14.5 13.5c-1-1-2.5-1.5-4-1.5" />
      {/* Sparkle accents for creativity */}
      <circle cx="7" cy="5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="4" cy="9" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="3" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function NonFictionIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Open book shape */}
      <path d="M2 4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4z" />
      <path d="M12 4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V4z" />
      {/* Center spine */}
      <path d="M12 2v20" />
      {/* Text lines - left page */}
      <path d="M5 7h4" />
      <path d="M5 10h4" />
      <path d="M5 13h3" />
      {/* Text lines - right page */}
      <path d="M15 7h4" />
      <path d="M15 10h4" />
      <path d="M15 13h3" />
    </svg>
  )
}

const ESSAY_TYPE_ICONS: Record<EssayType, React.ComponentType<{ size?: number }>> = {
  'Fiction': FictionIcon,
  'Non-Fiction': NonFictionIcon
}

const ESSAY_TYPE_DESCRIPTIONS: Record<EssayType, string> = {
  'Fiction': 'Creative stories, narratives, and imaginative writing',
  'Non-Fiction': 'Factual essays, arguments, and informative writing'
}

export default function EssayTypeSelector({ value, onChange }: EssayTypeSelectorProps) {
  return (
    <div className={styles.essayTypeGrid}>
      {ESSAY_TYPE_OPTIONS.map((option) => {
        const IconComponent = ESSAY_TYPE_ICONS[option]
        return (
          <button
            key={option}
            type="button"
            className={`${styles.essayTypeOption} ${value === option ? styles.selected : ''}`}
            onClick={() => onChange(option)}
          >
            <span className={styles.essayTypeIcon}>
              <IconComponent size={40} />
            </span>
            <span className={styles.essayTypeLabel}>{option}</span>
            <span className={styles.essayTypeDescription}>
              {ESSAY_TYPE_DESCRIPTIONS[option]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
