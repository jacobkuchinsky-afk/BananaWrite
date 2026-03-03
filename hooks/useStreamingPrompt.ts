'use client'

/**
 * useStreamingPrompt hook
 * Handles Server-Sent Events (SSE) streaming from Flask backend
 */

import { useState, useCallback, useRef } from 'react'
import { StreamChunk } from '@/types'

// Flask backend URL - change this when deploying
const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

interface StartStreamingOptions {
  lessonIndex: number
  writingTechnique?: string
  craziness?: string
  focus?: string
  essayType?: string
  difficultyLevel?: string
}

interface UseStreamingPromptReturn {
  // State
  streamedText: string
  isStreaming: boolean
  isComplete: boolean
  error: string | null
  
  // Actions
  startStreaming: (options: StartStreamingOptions) => Promise<string>
  reset: () => void
}

export function useStreamingPrompt(): UseStreamingPromptReturn {
  const [streamedText, setStreamedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    setStreamedText('')
    setIsStreaming(false)
    setIsComplete(false)
    setError(null)
    
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const startStreaming = useCallback(async (
    options: StartStreamingOptions
  ): Promise<string> => {
    const { lessonIndex, writingTechnique, craziness, focus, essayType, difficultyLevel } = options
    
    // Reset state
    reset()
    setIsStreaming(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${FLASK_API_URL}/api/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonIndex,
          writingTechnique,
          craziness,
          focus,
          essayType,
          difficulty_level: difficultyLevel
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6) // Remove 'data: ' prefix
              const data: StreamChunk = JSON.parse(jsonStr)

              if (data.type === 'chunk') {
                fullText += data.content
                setStreamedText(fullText)
              } else if (data.type === 'done') {
                fullText = data.content
                setStreamedText(fullText)
                setIsComplete(true)
                setIsStreaming(false)
              } else if (data.type === 'error') {
                throw new Error(data.content)
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }

      setIsStreaming(false)
      setIsComplete(true)
      return fullText

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, not an error
        return ''
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prompt'
      setError(errorMessage)
      setIsStreaming(false)
      throw err
    }
  }, [reset])

  return {
    streamedText,
    isStreaming,
    isComplete,
    error,
    startStreaming,
    reset
  }
}

