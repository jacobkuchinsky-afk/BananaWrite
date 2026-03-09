'use client'

import { UserProfile, UserProgress, UserSettings, DIFFICULTY_LEVEL_LABELS, GRADE_WRITING_TECHNIQUES, DifficultyLevel } from '@/types'
import styles from './Teacher.module.css'

interface StudentHeaderProps {
  profile: UserProfile | null
  progress: UserProgress | null
  settings: UserSettings | null
  sessionStatus: string
}

export default function StudentHeader({ profile, progress, settings, sessionStatus }: StudentHeaderProps) {
  const displayName = profile?.displayName || 'Student'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const difficultyLevel = (settings?.difficultyLevel || 'proficient') as DifficultyLevel
  const techniques = GRADE_WRITING_TECHNIQUES[difficultyLevel]
  const currentLesson = progress?.currentLesson ?? 0
  const currentSkill = techniques[currentLesson] || 'Commas'

  const statusClass =
    sessionStatus === 'writing' ? styles.statusWriting
    : sessionStatus === 'submitted' ? styles.statusQuiz
    : styles.statusIdle

  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className={styles.studentHeader}>
      <div className={styles.studentAvatar}>{initials}</div>
      <div className={styles.studentInfo}>
        <div className={styles.studentDetailName}>{displayName}</div>
        <div className={styles.studentDetailEmail}>{profile?.email || '—'}</div>
        <div className={styles.studentMeta}>
          <span className={styles.metaTag}>
            {DIFFICULTY_LEVEL_LABELS[difficultyLevel]}
          </span>
          <span className={styles.metaTag}>Lesson {currentLesson + 1}: {currentSkill}</span>
          <span className={styles.metaTag}>{progress?.totalXP ?? 0} XP</span>
          <span className={statusClass}>{sessionStatus}</span>
          <span className={styles.metaTag}>Since {memberSince}</span>
        </div>
      </div>
    </div>
  )
}
