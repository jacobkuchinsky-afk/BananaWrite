'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getUserSettings, updateUserTheme } from '@/lib/firestore'
import { Theme } from '@/types'

const STORAGE_KEY = 'bananawrite-theme'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>('light')
  const [firestoreSynced, setFirestoreSynced] = useState(false)

  // On mount, read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored)
      applyTheme(stored)
    }
  }, [])

  // When user authenticates, sync from Firestore (Firestore wins)
  useEffect(() => {
    if (!user || firestoreSynced) return

    getUserSettings(user.uid).then((settings) => {
      if (settings?.theme && (settings.theme === 'light' || settings.theme === 'dark')) {
        setThemeState(settings.theme)
        applyTheme(settings.theme)
        localStorage.setItem(STORAGE_KEY, settings.theme)
      }
      setFirestoreSynced(true)
    }).catch(() => {
      setFirestoreSynced(true)
    })
  }, [user, firestoreSynced])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    if (user) {
      updateUserTheme(user.uid, newTheme).catch(() => {})
    }
  }, [user])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
