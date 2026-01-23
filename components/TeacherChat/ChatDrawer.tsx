'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { TeacherChatMessage } from '@/types'
import { SendIcon } from '@/components/Icons/Icons'
import ChatMessage from './ChatMessage'
import styles from './TeacherChat.module.css'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  messages: TeacherChatMessage[]
  isLoading: boolean
  error: string | null
  onSendMessage: (content: string) => Promise<void>
  topic?: string
}

export default function ChatDrawer({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  onSendMessage,
  topic
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300) // Wait for animation
    }
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isSending || isLoading) return

    setIsSending(true)
    const messageText = inputText.trim()
    setInputText('')

    try {
      await onSendMessage(messageText)
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Handle clicking overlay to close
  const handleOverlayClick = () => {
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={handleOverlayClick}
      />
      
      {/* Drawer */}
      <div className={`${styles.chatDrawer} ${isOpen ? styles.chatDrawerOpen : ''}`}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderInfo}>
            <div className={styles.chatHeaderIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className={styles.chatHeaderTitle}>Ask Your Teacher</h3>
              {topic && <span className={styles.chatHeaderTopic}>Topic: {topic}</span>}
            </div>
          </div>
          <button 
            className={styles.chatCloseBtn}
            onClick={onClose}
            aria-label="Close chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className={styles.chatMessages}>
          {messages.length === 0 ? (
            <div className={styles.chatEmpty}>
              <div className={styles.chatEmptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="10" r="1" fill="currentColor" />
                  <circle cx="8" cy="10" r="1" fill="currentColor" />
                  <circle cx="16" cy="10" r="1" fill="currentColor" />
                </svg>
              </div>
              <h4 className={styles.chatEmptyTitle}>Need help?</h4>
              <p className={styles.chatEmptyText}>
                Ask me anything about grammar, punctuation, or the questions you got wrong. I&apos;m here to help you understand!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.messageAssistant}`}>
                  <div className={styles.messageBubble}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.chatError}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Input */}
        <div className={styles.chatInputContainer}>
          <form onSubmit={handleSubmit} className={styles.chatInputForm}>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              className={styles.chatInput}
              disabled={isSending || isLoading}
            />
            <button
              type="submit"
              className={styles.chatSendBtn}
              disabled={!inputText.trim() || isSending || isLoading}
              aria-label="Send message"
            >
              <SendIcon size={20} />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
