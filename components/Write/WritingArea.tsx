'use client'

import { useRef, useEffect } from 'react'
import styles from './Write.module.css'

interface WritingAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function WritingArea({ 
  value, 
  onChange, 
  placeholder = 'Start writing your essay here...',
  disabled = false
}: WritingAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight, with a minimum height
      const minHeight = 400
      const newHeight = Math.max(textarea.scrollHeight, minHeight)
      textarea.style.height = `${newHeight}px`
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={styles.writingSection}>
      <textarea
        ref={textareaRef}
        className={styles.writingArea}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={true}
        autoFocus
      />
    </div>
  )
}





