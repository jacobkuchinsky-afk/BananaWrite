'use client'

/**
 * useUserSession hook
 * Manages user session state with Firestore
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  getFullUserData, 
  initializeUser, 
  getCurrentSession,
  getUserProgress,
  startWritingSession as startWritingSessionDB,
  saveEssayDraft as saveEssayDraftDB,
  submitEssay as submitEssayDB,
  resetSession as resetSessionDB
} from '@/lib/firestore'
import { UserProgress, CurrentSession } from '@/types'

interface UseUserSessionReturn {
  // State
  progress: UserProgress | null
  session: CurrentSession | null
  loading: boolean
  error: string | null
  
  // Actions
  refreshSession: () => Promise<void>
  startWritingSession: (writingTechnique: string, essayPrompt: string) => Promise<void>
  saveEssayDraft: (essayDraft: string, wordCount: number) => Promise<void>
  submitEssay: (activeMinutes?: number) => Promise<void>
  resetSession: () => Promise<void>
}

export function useUserSession(): UseUserSessionReturn {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [session, setSession] = useState<CurrentSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user and fetch data on mount
  useEffect(() => {
    async function initAndFetch() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log('Initializing user session for:', user.uid)

        // Initialize user if new (this is idempotent)
        await initializeUser(user.uid, user.email || '', user.displayName)
        console.log('User initialized successfully')

        // Fetch full user data
        const data = await getFullUserData(user.uid)
        console.log('User data fetched:', data)
        
        setProgress(data.progress)
        setSession(data.session)
      } catch (err: unknown) {
        console.error('Error initializing user session:', err)
        
        // Provide more specific error messages
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        
        if (errorMessage.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.')
        } else if (errorMessage.includes('not-found') || errorMessage.includes('NOT_FOUND')) {
          setError('Firestore database not found. Please enable Firestore in Firebase Console.')
        } else if (errorMessage.includes('unavailable')) {
          setError('Firestore is unavailable. Please check your internet connection.')
        } else {
          setError(`Failed to load user data: ${errorMessage}`)
        }
      } finally {
        setLoading(false)
      }
    }

    initAndFetch()
  }, [user])

  // Refresh session data
  const refreshSession = useCallback(async () => {
    if (!user) return

    try {
      const [newProgress, newSession] = await Promise.all([
        getUserProgress(user.uid),
        getCurrentSession(user.uid)
      ])
      setProgress(newProgress)
      setSession(newSession)
    } catch (err) {
      console.error('Error refreshing session:', err)
      setError('Failed to refresh session')
    }
  }, [user])

  // Start a new writing session
  const startWritingSession = useCallback(async (writingTechnique: string, essayPrompt: string) => {
    if (!user) return

    try {
      await startWritingSessionDB(user.uid, writingTechnique, essayPrompt)
      await refreshSession()
    } catch (err) {
      console.error('Error starting writing session:', err)
      setError('Failed to start writing session')
      throw err
    }
  }, [user, refreshSession])

  // Save essay draft
  const saveEssayDraft = useCallback(async (essayDraft: string, wordCount: number) => {
    if (!user) return

    try {
      await saveEssayDraftDB(user.uid, essayDraft, wordCount)
      // Update local state without full refresh for better UX
      setSession(prev => prev ? {
        ...prev,
        essayDraft,
        wordCount
      } : null)
    } catch (err) {
      console.error('Error saving draft:', err)
      setError('Failed to save draft')
      throw err
    }
  }, [user])

  // Submit essay
  const submitEssay = useCallback(async (activeMinutes?: number) => {
    if (!user) return

    try {
      await submitEssayDB(user.uid, activeMinutes)
      await refreshSession()
    } catch (err) {
      console.error('Error submitting essay:', err)
      setError('Failed to submit essay')
      throw err
    }
  }, [user, refreshSession])

  // Reset session
  const resetSession = useCallback(async () => {
    if (!user) return

    try {
      await resetSessionDB(user.uid)
      await refreshSession()
    } catch (err) {
      console.error('Error resetting session:', err)
      setError('Failed to reset session')
      throw err
    }
  }, [user, refreshSession])

  return {
    progress,
    session,
    loading,
    error,
    refreshSession,
    startWritingSession,
    saveEssayDraft,
    submitEssay,
    resetSession
  }
}

