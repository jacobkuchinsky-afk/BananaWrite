'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUserSettings } from '@/lib/firestore'
import styles from './Auth.module.css'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireSetup?: boolean  // Default true - most pages require setup
}

export default function ProtectedRoute({ children, requireSetup = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingSetup, setCheckingSetup] = useState(requireSetup)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Check if user has completed setup
  useEffect(() => {
    async function checkSetup() {
      if (!requireSetup || !user || loading) {
        setCheckingSetup(false)
        return
      }

      try {
        const settings = await getUserSettings(user.uid)
        if (!settings?.setupComplete) {
          // User hasn't completed setup, redirect to setup page
          router.push('/setup')
          return
        }
        setSetupComplete(true)
      } catch (error) {
        console.error('Error checking setup status:', error)
        // On error, redirect to setup page to be safe
        router.push('/setup')
        return
      } finally {
        setCheckingSetup(false)
      }
    }

    if (user && !loading) {
      checkSetup()
    }
  }, [user, loading, router, requireSetup])

  if (loading || checkingSetup) {
    return (
      <div className={styles.authPage}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // If setup is required but not complete, don't render children
  if (requireSetup && !setupComplete) {
    return null
  }

  return <>{children}</>
}




