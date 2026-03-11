'use client'

import { useEffect, useRef, useCallback } from 'react'

const IDLE_TIMEOUT_MS = 45_000

/**
 * Tracks user activity (keystrokes, mouse movement, clicks, page focus)
 * and exposes the total active minutes (time with recent input AND focused tab).
 * 
 * The counter pauses after 45s of no input or when the tab loses focus,
 * preventing AFK time from inflating XP.
 */
export function useActivityTracker() {
  const activeSecondsRef = useRef(0)
  const lastActivityRef = useRef(Date.now())
  const isFocusedRef = useRef(true)
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      isFocusedRef.current = document.visibilityState === 'visible'
      if (isFocusedRef.current) {
        lastActivityRef.current = Date.now()
      }
    }

    window.addEventListener('keydown', recordActivity)
    window.addEventListener('mousemove', recordActivity)
    window.addEventListener('click', recordActivity)
    window.addEventListener('touchstart', recordActivity)
    document.addEventListener('visibilitychange', onVisibilityChange)

    tickIntervalRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      if (isFocusedRef.current && timeSinceActivity < IDLE_TIMEOUT_MS) {
        activeSecondsRef.current += 1
      }
    }, 1000)

    return () => {
      window.removeEventListener('keydown', recordActivity)
      window.removeEventListener('mousemove', recordActivity)
      window.removeEventListener('click', recordActivity)
      window.removeEventListener('touchstart', recordActivity)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current)
    }
  }, [recordActivity])

  const getActiveMinutes = useCallback(() => {
    return activeSecondsRef.current / 60
  }, [])

  const reset = useCallback(() => {
    activeSecondsRef.current = 0
    lastActivityRef.current = Date.now()
  }, [])

  return { getActiveMinutes, reset }
}
