'use client'

import { useRouter } from 'next/navigation'
import styles from './Dashboard.module.css'
import { CurrentSession } from '@/types'

interface StartLessonButtonProps {
  session: CurrentSession | null
  currentSkill: string
  loading?: boolean
}

export default function StartLessonButton({ 
  session, 
  currentSkill, 
  loading = false 
}: StartLessonButtonProps) {
  const router = useRouter()

  // Determine if we're continuing or starting fresh
  const isWriting = session?.status === 'writing' && session.essayDraft
  const hasPrompt = session?.essayPrompt
  
  const handleClick = () => {
    router.push('/write')
  }

  // Button text based on session state
  const getButtonContent = () => {
    if (isWriting) {
      // User has an in-progress essay
      const wordCount = session?.wordCount || 0
      return {
        icon: '',
        text: 'Continue Writing',
        subtext: `${wordCount}/300 words saved`
      }
    } else if (hasPrompt) {
      // User has a prompt but hasn't started writing
      return {
        icon: '',
        text: 'Start Writing',
        subtext: 'Your prompt is ready'
      }
    } else {
      // New lesson (display "Anything" instead of "None")
      const displaySkill = currentSkill === 'None' ? 'Anything' : currentSkill
      return {
        icon: '',
        text: 'Start Lesson',
        subtext: `Learning: ${displaySkill}`
      }
    }
  }

  const content = getButtonContent()

  return (
    <button
      className={`${styles.startLessonBtn} ${isWriting ? styles.continueVariant : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      <span className={styles.btnIcon}>{content.icon}</span>
      <span className={styles.btnText}>{content.text}</span>
      <span className={styles.btnSubtext}>{content.subtext}</span>
    </button>
  )
}

