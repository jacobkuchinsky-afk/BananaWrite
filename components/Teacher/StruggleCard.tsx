'use client'

import { useState } from 'react'
import { StruggleArea } from '@/lib/adminFirestore'
import ScoreTrendChart from './ScoreTrendChart'
import styles from './Teacher.module.css'

interface StruggleCardProps {
  area: StruggleArea
}

export default function StruggleCard({ area }: StruggleCardProps) {
  const [expanded, setExpanded] = useState(false)

  const trendLabel = area.trend === 'improving' ? '↑ Improving' : area.trend === 'declining' ? '↓ Declining' : '→ Stable'
  const trendClass = area.trend === 'improving' ? styles.trendImproving : area.trend === 'declining' ? styles.trendDeclining : styles.trendStable

  return (
    <div
      className={expanded ? styles.struggleCardExpanded : styles.struggleCard}
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
    >
      <div className={styles.struggleHeader}>
        <span className={styles.struggleCategory}>{area.category}</span>
        <span className={`${styles.struggleTrend} ${trendClass}`}>{trendLabel}</span>
      </div>
      <div className={styles.struggleDetails}>
        <span>{area.occurrences} quiz{area.occurrences !== 1 ? 'zes' : ''}</span>
        <span>
          Latest:{' '}
          <span className={`${styles.struggleScore} ${area.latestScore >= 75 ? styles.scorePassed : styles.scoreFailed}`}>
            {area.latestScore}%
          </span>
        </span>
        {area.mastered && <span className={styles.metaTag} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>Mastered</span>}
      </div>

      {expanded && area.scores.length > 0 && (
        <ScoreTrendChart data={area.scores} />
      )}
    </div>
  )
}
