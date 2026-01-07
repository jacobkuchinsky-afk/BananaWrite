'use client'

/**
 * useAutoSave hook
 * Automatically saves essay draft to Firestore at regular intervals
 */

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoSaveOptions {
  // Callback to save the content
  onSave: (content: string, wordCount: number) => Promise<void>
  // Interval in milliseconds (default: 30 seconds)
  interval?: number
  // Debounce delay for manual triggers (default: 1 second)
  debounceDelay?: number
}

interface UseAutoSaveReturn {
  // Trigger a save (debounced)
  triggerSave: (content: string, wordCount: number) => void
  // Force an immediate save
  saveNow: (content: string, wordCount: number) => Promise<void>
  // Is currently saving
  isSaving: boolean
  // Last save time
  lastSaved: Date | null
  // Time since last save in readable format
  lastSavedText: string
}

export function useAutoSave({
  onSave,
  interval = 30000, // 30 seconds
  debounceDelay = 1000 // 1 second
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastSavedText, setLastSavedText] = useState('')
  
  const contentRef = useRef<string>('')
  const wordCountRef = useRef<number>(0)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const intervalTimerRef = useRef<NodeJS.Timeout>()
  const hasChangesRef = useRef(false)

  // Update last saved text every minute
  useEffect(() => {
    const updateLastSavedText = () => {
      if (!lastSaved) {
        setLastSavedText('')
        return
      }

      const now = new Date()
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)

      if (diff < 5) {
        setLastSavedText('Just saved')
      } else if (diff < 60) {
        setLastSavedText(`Saved ${diff} seconds ago`)
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60)
        setLastSavedText(`Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`)
      } else {
        const hours = Math.floor(diff / 3600)
        setLastSavedText(`Saved ${hours} hour${hours > 1 ? 's' : ''} ago`)
      }
    }

    updateLastSavedText()
    const timer = setInterval(updateLastSavedText, 10000) // Update every 10 seconds

    return () => clearInterval(timer)
  }, [lastSaved])

  // Perform the save
  const performSave = useCallback(async () => {
    if (!hasChangesRef.current || isSaving) return

    setIsSaving(true)
    try {
      await onSave(contentRef.current, wordCountRef.current)
      setLastSaved(new Date())
      hasChangesRef.current = false
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  // Set up interval auto-save
  useEffect(() => {
    intervalTimerRef.current = setInterval(() => {
      if (hasChangesRef.current) {
        performSave()
      }
    }, interval)

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [interval, performSave])

  // Trigger save (debounced)
  const triggerSave = useCallback((content: string, wordCount: number) => {
    contentRef.current = content
    wordCountRef.current = wordCount
    hasChangesRef.current = true

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, debounceDelay)
  }, [debounceDelay, performSave])

  // Force immediate save
  const saveNow = useCallback(async (content: string, wordCount: number) => {
    contentRef.current = content
    wordCountRef.current = wordCount
    hasChangesRef.current = true

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    await performSave()
  }, [performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [])

  return {
    triggerSave,
    saveNow,
    isSaving,
    lastSaved,
    lastSavedText
  }
}





