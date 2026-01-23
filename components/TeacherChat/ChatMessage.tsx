'use client'

import ReactMarkdown from 'react-markdown'
import { TeacherChatMessage } from '@/types'
import styles from './TeacherChat.module.css'

interface ChatMessageProps {
  message: TeacherChatMessage
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`${styles.message} ${isUser ? styles.messageUser : styles.messageAssistant}`}>
      <div className={styles.messageBubble}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              // Custom styling for markdown elements
              p: ({ children }) => <p className={styles.markdownP}>{children}</p>,
              strong: ({ children }) => <strong className={styles.markdownStrong}>{children}</strong>,
              em: ({ children }) => <em className={styles.markdownEm}>{children}</em>,
              ul: ({ children }) => <ul className={styles.markdownUl}>{children}</ul>,
              ol: ({ children }) => <ol className={styles.markdownOl}>{children}</ol>,
              li: ({ children }) => <li className={styles.markdownLi}>{children}</li>,
              code: ({ children }) => <code className={styles.markdownCode}>{children}</code>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      <span className={styles.messageTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}
