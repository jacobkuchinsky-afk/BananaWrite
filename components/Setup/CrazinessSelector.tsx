'use client'

import { CRAZINESS_OPTIONS, CrazinessLevel } from '@/types'
import {
  MundaneIcon,
  OrdinaryIcon,
  MildlyInterestingIcon,
  EngagingIcon,
  QuirkyIcon,
  UnusualIcon,
  WildIcon,
  BizarreIcon,
  AbsurdIcon,
  UnhingedIcon
} from '@/components/Icons/Icons'
import styles from './Setup.module.css'

// Icon mapping for each craziness level
const CRAZINESS_ICONS: Record<CrazinessLevel, React.ComponentType<{ size?: number; className?: string }>> = {
  'Mundane': MundaneIcon,
  'Ordinary': OrdinaryIcon,
  'Mildly Interesting': MildlyInterestingIcon,
  'Engaging': EngagingIcon,
  'Quirky': QuirkyIcon,
  'Unusual': UnusualIcon,
  'Wild': WildIcon,
  'Bizarre': BizarreIcon,
  'Absurd': AbsurdIcon,
  'Completely Unhinged': UnhingedIcon
}

interface CrazinessSelectorProps {
  value: CrazinessLevel | null
  onChange: (value: CrazinessLevel) => void
}

export default function CrazinessSelector({ value, onChange }: CrazinessSelectorProps) {
  return (
    <div className={styles.crazinessGrid}>
      {CRAZINESS_OPTIONS.map((option) => {
        const IconComponent = CRAZINESS_ICONS[option]
        return (
          <button
            key={option}
            type="button"
            className={`${styles.crazinessOption} ${value === option ? styles.selected : ''}`}
            onClick={() => onChange(option)}
          >
            <span className={styles.crazinessIcon}>
              <IconComponent size={28} />
            </span>
            <span className={styles.crazinessLabel}>{option}</span>
          </button>
        )
      })}
    </div>
  )
}

