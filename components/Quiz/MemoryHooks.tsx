'use client'

import { ArrowRightIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'

interface MemoryHooksProps {
  hooks: string[]
  onContinue: () => void
}

export default function MemoryHooks({ hooks, onContinue }: MemoryHooksProps) {
  return (
    <div className={styles.memoryHooksCard}>
      <h3 className={styles.memoryHooksTitle}>
        <span className={styles.memoryHooksIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" fill="#fbbf24"/>
            <path d="M9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21Z" fill="#a16207"/>
            <path d="M9 18H15V20H9V18Z" fill="#d97706"/>
            <path d="M12 6C10.34 6 9 7.34 9 9H11C11 8.45 11.45 8 12 8C12.55 8 13 8.45 13 9C13 9.55 12.55 10 12 10H11V12H13V11.82C14.16 11.4 15 10.3 15 9C15 7.34 13.66 6 12 6Z" fill="#fef3c7"/>
          </svg>
        </span>
        Tips to Remember
      </h3>
      
      <div className={styles.memoryHooksList}>
        {hooks.map((hook, index) => (
          <div key={index} className={styles.memoryHook}>
            <span className={styles.memoryHookBullet}>•</span>
            <span>{hook}</span>
          </div>
        ))}
      </div>
      
      <button className={styles.continueBtn} onClick={onContinue} style={{ marginTop: '1.5rem' }}>
        Try Again <ArrowRightIcon size={18} />
      </button>
    </div>
  )
}

