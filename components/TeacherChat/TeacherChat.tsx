'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { TeacherChatContext } from '@/types'
import { useTeacherChat } from '@/hooks/useTeacherChat'
import ChatDrawer from './ChatDrawer'
import styles from './TeacherChat.module.css'

interface TeacherChatProps {
  context: TeacherChatContext
  difficultyLevel?: string
}

export interface TeacherChatRef {
  open: () => void
}

const TeacherChat = forwardRef<TeacherChatRef, TeacherChatProps>(({ context, difficultyLevel = 'proficient' }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, error, sendMessage, setContext, clearChat } = useTeacherChat(context, difficultyLevel)

  // Expose open method to parent via ref
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true)
  }))

  // Update context when it changes
  useEffect(() => {
    setContext(context)
  }, [context, setContext])

  // Clear chat when context topic changes (new quiz topic)
  useEffect(() => {
    if (context.topic) {
      clearChat()
    }
  }, [context.topic, clearChat])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className={`${styles.fab} ${isOpen ? styles.fabHidden : ''}`}
        onClick={handleOpen}
        aria-label="Open teacher chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className={styles.fabLabel}>Ask AI Teacher</span>
      </button>

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
      />
    </>
  )
})

TeacherChat.displayName = 'TeacherChat'

export default TeacherChat
