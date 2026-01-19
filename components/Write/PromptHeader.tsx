'use client'

import styles from './Write.module.css'

interface PromptHeaderProps {
  prompt: string
  writingTechnique: string
}

export default function PromptHeader({ prompt, writingTechnique }: PromptHeaderProps) {
  // Split prompt into main prompt and additional info if present
  const lines = prompt.split('\n').filter(line => line.trim())
  const mainPrompt = lines[0] || ''
  const additionalInfo = lines.slice(1).join('\n')

  return (
    <div className={styles.promptCard}>
      <p className={styles.promptLabel}>Your Writing Prompt</p>
      <p className={styles.promptText}>{mainPrompt}</p>
      {additionalInfo && additionalInfo.toLowerCase() !== 'none' && (
        <p className={styles.promptText} style={{ marginTop: '0.75rem', fontSize: '1rem', opacity: 0.8 }}>
          {additionalInfo}
        </p>
      )}
      {writingTechnique && (
        <span className={styles.skillBadge}>
          Focus: {writingTechnique === 'None' ? 'Anything' : writingTechnique}
        </span>
      )}
    </div>
  )
}




