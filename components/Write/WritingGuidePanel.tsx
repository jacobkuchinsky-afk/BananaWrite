'use client'

import { useEffect } from 'react'
import { DifficultyLevel, DIFFICULTY_LEVEL_LABELS } from '@/types'
import { GRADE_WRITING_TIPS, TECHNIQUE_GUIDE } from './WritingGuideData'
import { CloseIcon } from '@/components/Icons/Icons'
import styles from './Write.module.css'

interface WritingGuidePanelProps {
  isOpen: boolean
  onClose: () => void
  writingTechnique: string
  difficultyLevel: DifficultyLevel
}

export default function WritingGuidePanel({
  isOpen,
  onClose,
  writingTechnique,
  difficultyLevel,
}: WritingGuidePanelProps) {
  const gradeTips = GRADE_WRITING_TIPS[difficultyLevel]
  const techniqueData = writingTechnique
    ? TECHNIQUE_GUIDE[difficultyLevel]?.[writingTechnique]
    : null
  const gradeLabel = DIFFICULTY_LEVEL_LABELS[difficultyLevel]

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('• ')) {
        return <p key={i} style={{ paddingLeft: '1rem' }}>{line}</p>
      }
      return <p key={i}>{line}</p>
    })
  }

  return (
    <>
      <div
        className={`${styles.guideOverlay} ${isOpen ? styles.guideOverlayVisible : ''}`}
        onClick={onClose}
      />
      <div
        className={`${styles.guidePanel} ${isOpen ? styles.guidePanelOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Writing Guide"
      >
        <div className={styles.guidePanelHeader}>
          <div>
            <h2 className={styles.guidePanelTitle}>Writing Guide</h2>
            <p className={styles.guidePanelSubtitle}>{gradeLabel}</p>
          </div>
          <button
            className={styles.guidePanelClose}
            onClick={onClose}
            aria-label="Close guide"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.guidePanelBody}>
          {techniqueData ? (
            <>
              {/* Section 1: Understanding Your Prompt */}
              <div className={styles.guideSection}>
                <div className={styles.guideSectionHeader}>
                  <span className={styles.guideSectionIcon}>💡</span>
                  <h3 className={styles.guideSectionTitle}>
                    Understanding: {writingTechnique}
                  </h3>
                </div>
                <div className={styles.guideSectionContent}>
                  {renderFormattedText(techniqueData.what)}
                  <div className={styles.guideTeksNote}>
                    {techniqueData.why}
                  </div>
                </div>
              </div>

              {/* Section 2: How to Use This Technique */}
              <div className={styles.guideSection}>
                <div className={styles.guideSectionHeader}>
                  <span className={styles.guideSectionIcon}>✏️</span>
                  <h3 className={styles.guideSectionTitle}>
                    How to Use This Technique
                  </h3>
                </div>
                <div className={styles.guideSectionContent}>
                  {renderFormattedText(techniqueData.howToUse)}
                  <pre>{techniqueData.exampleSnippet}</pre>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.guideNoTechnique}>
              <div className={styles.guideNoTechniqueIcon}>📝</div>
              <h3 className={styles.guideNoTechniqueTitle}>
                No Specific Technique
              </h3>
              <p className={styles.guideNoTechniqueText}>
                Your current prompt doesn&apos;t focus on a specific writing technique.
                Check out the essay structure and writing tips below to guide your writing!
              </p>
            </div>
          )}

          {/* Section 3: Essay Structure Guide */}
          <div className={styles.guideSection}>
            <div className={styles.guideSectionHeader}>
              <span className={styles.guideSectionIcon}>📐</span>
              <h3 className={styles.guideSectionTitle}>
                Essay Structure Guide
              </h3>
            </div>
            <div className={styles.guideSectionContent}>
              <p>{gradeTips.overview}</p>
              <pre>{gradeTips.essayFormat}</pre>
            </div>
          </div>

          {/* Section 4: Writing Tips */}
          <div className={styles.guideSection}>
            <div className={styles.guideSectionHeader}>
              <span className={styles.guideSectionIcon}>⭐</span>
              <h3 className={styles.guideSectionTitle}>
                Writing Tips for {gradeLabel}
              </h3>
            </div>
            <div className={styles.guideSectionContent}>
              <ul className={styles.guideTipsList}>
                {gradeTips.tips.map((tip, i) => (
                  <li key={i} className={styles.guideTipItem}>
                    <span className={styles.guideTipNumber}>{i + 1}</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 5: TEKS Standards */}
          <div className={styles.guideSection}>
            <div className={styles.guideSectionHeader}>
              <span className={styles.guideSectionIcon}>📋</span>
              <h3 className={styles.guideSectionTitle}>TEKS Standards</h3>
            </div>
            <div className={styles.guideSectionContent}>
              <div className={styles.guideTeksNote}>
                {gradeTips.teksStandards}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
