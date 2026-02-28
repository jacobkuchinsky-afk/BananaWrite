'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from '@/lib/firebase'
import { SUPER_ADMIN_EMAIL } from '@/types'
import { getAdminEmails } from '@/lib/adminFirestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerificationEmail: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user?.email) {
        const email = user.email.toLowerCase()
        if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
          setIsAdmin(true)
        } else {
          try {
            const admins = await getAdminEmails()
            setIsAdmin(admins.includes(email))
          } catch {
            setIsAdmin(false)
          }
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    // Send verification email after signup
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user)
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const resendVerificationEmail = async () => {
    if (user) {
      await sendEmailVerification(user)
    }
  }

  const value = {
    user,
    loading,
    isAdmin,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerificationEmail
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

