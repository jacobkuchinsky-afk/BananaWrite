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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5v0A5.5 5.5 0 0 1 6.5 12v0A5.5 5.5 0 0 1 12 6.5Z" />
      <path d="m9 9 1.5 1.5" />
      <path d="M14.5 9 13 10.5" />
      <path d="M9 15.5s1 1.5 3 1.5 3-1.5 3-1.5" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
    </svg>
  )
}

function NonFictionIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
      <path d="M8 15h6" />
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
