'use client'

/**
 * useTeacherChat hook
 * Manages teacher chat state and API communication
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  TeacherChatMessage, 
  TeacherChatContext, 
  TeacherChatResponse 
} from '@/types'

// Flask backend URL
const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

interface UseTeacherChatReturn {
  // State
  messages: TeacherChatMessage[]
  isLoading: boolean
  error: string | null
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  setContext: (context: TeacherChatContext) => void
  clearChat: () => void
}

export function useTeacherChat(initialContext?: TeacherChatContext, difficultyLevel: string = 'proficient'): UseTeacherChatReturn {
  const [messages, setMessages] = useState<TeacherChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const contextRef = useRef<TeacherChatContext>(initialContext || {
    topic: '',
    wrongAnswers: [],
    feedbackExplanations: [],
    currentFeedback: '',
    memoryHooks: []
  })
  const difficultyRef = useRef(difficultyLevel)
  useEffect(() => { difficultyRef.current = difficultyLevel }, [difficultyLevel])

  // Update context
  const setContext = useCallback((context: TeacherChatContext) => {
    contextRef.current = context
  }, [])

  // Clear chat messages
  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    setError(null)
    
    // Create user message
    const userMessage: TeacherChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    // Add user message to state
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Build messages array for API (without id and timestamp)
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch(`${FLASK_API_URL}/api/teacher-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          context: contextRef.current,
          difficulty_level: difficultyRef.current
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: TeacherChatResponse = await response.json()

      // Create assistant message
      const assistantMessage: TeacherChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      console.error('Teacher chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [messages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setContext,
    clearChat
  }
}
