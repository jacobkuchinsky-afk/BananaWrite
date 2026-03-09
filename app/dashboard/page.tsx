'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useUserSession } from '@/hooks/useUserSession'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import StartLessonButton from '@/components/Dashboard/StartLessonButton'
import UpdateNotificationModal from '@/components/Dashboard/UpdateNotificationModal'
import ProfilePicture from '@/components/Settings/ProfilePicture'
import { SettingsIcon, BellIcon, SunIcon, MoonIcon } from '@/components/Icons/Icons'
import { useTheme } from '@/context/ThemeContext'
import { UpdateNotification, GRADE_WRITING_TECHNIQUES, DifficultyLevel, UserSettings } from '@/types'
import { getLatestUpdateNotification } from '@/lib/adminFirestore'
import { getUserDismissedNotificationId, dismissUpdateNotification, getUserSettings } from '@/lib/firestore'
import styles from '@/components/Dashboard/Dashboard.module.css'

function DashboardContent() {
  const { user, resendVerificationEmail, isAdmin, isTeacher } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { progress, session, loading, error, refreshSession } = useUserSession()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearTimeout(resendTimerRef.current)
    }
  }, [])
  
  // Update notification state
  const [pendingNotification, setPendingNotification] = useState<UpdateNotification | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  // Fetch user settings for difficulty level
  useEffect(() => {
    async function fetchSettings() {
      if (!user) return
      try {
        const settings = await getUserSettings(user.uid)
        if (settings) setUserSettings(settings)
      } catch (err) {
        console.error('Error fetching user settings:', err)
      }
    }
    fetchSettings()
  }, [user])

  // Check for pending update notifications
  useEffect(() => {
    async function checkForNotification() {
      if (!user) return

      try {
        const [latestNotification, dismissedId] = await Promise.all([
          getLatestUpdateNotification(),
          getUserDismissedNotificationId(user.uid)
        ])

        // Show notification if there's a new one the user hasn't dismissed
        if (latestNotification && latestNotification.id !== dismissedId) {
          setPendingNotification(latestNotification)
          setShowNotificationModal(true)
        }
      } catch (err) {
        console.error('Error checking for notifications:', err)
      }
    }

    checkForNotification()
  }, [user])

  // Handle dismissing the notification
  const handleDismissNotification = async () => {
    if (!user || !pendingNotification) return

    try {
      await dismissUpdateNotification(user.uid, pendingNotification.id)
      setShowNotificationModal(false)
      setPendingNotification(null)
    } catch (err) {
      console.error('Error dismissing notification:', err)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await resendVerificationEmail()
      setResendSuccess(true)
      resendTimerRef.current = setTimeout(() => setResendSuccess(false), 5000)
    } catch (error) {
      console.error('Resend verification error:', error)
    } finally {
      setResendLoading(false)
    }
  }

  // Get current skill name using grade-level technique track
  const difficultyLevel = (userSettings?.difficultyLevel || 'proficient') as DifficultyLevel
  const techniques = GRADE_WRITING_TECHNIQUES[difficultyLevel]
  const currentLesson = progress?.currentLesson ?? 0
  const currentSkill = techniques[currentLesson] || 'Commas'
  const totalSkills = techniques.length
  const progressPercent = (currentLesson / totalSkills) * 100

  // Get display name
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Writer'
  
  return (
    <div className={styles.dashboardPage}>
      {/* Update Notification Modal */}
      {showNotificationModal && pendingNotification && (
        <UpdateNotificationModal
          notification={pendingNotification}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* Verification Banner */}
      {user && !user.emailVerified && (
        <div className={styles.verificationBanner}>
          <p className={styles.verificationText}>
            Your email is not verified.{' '}
            <button 
              onClick={handleResendVerification}
              disabled={resendLoading}
              className={styles.resendBtn}
            >
              {resendLoading ? 'Sending...' : resendSuccess ? 'Email sent!' : 'Resend verification email'}
            </button>
          </p>
        </div>
      )}

      {/* Header */}
      <header className={styles.dashboardHeader}>
        <Link href="/">
          <Image
            src="/images/Logo.png"
            alt="BananaWrite"
            width={400}
            height={100}
            className={styles.dashboardLogo}
          />
        </Link>
        <div className={styles.headerRight}>
          {isTeacher && (
            <Link href="/teacher" className={styles.adminLink}>
              Teacher
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className={styles.adminLink}>
              Admin
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className={styles.bellButton}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
          </button>
          <Link href="/notifications" className={styles.bellButton} aria-label="Notifications">
            <BellIcon size={22} />
          </Link>
          <Link href="/settings">
            <ProfilePicture
              photoURL={user?.photoURL}
              displayName={displayName}
              size="small"
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className={styles.dashboardContent}>
        {loading ? (
          // Loading State
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading your progress...</p>
          </div>
        ) : error ? (
          // Error State
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button onClick={refreshSession} className={styles.retryBtn}>
              Try Again
            </button>
          </div>
        ) : (
          // Main Dashboard Content
          <>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, {displayName}!
              </h1>
              <p className={styles.currentSkill}>
                Current Skill: <span className={styles.skillName}>{currentSkill}</span>
                {currentLesson > 0 && ` (Lesson ${currentLesson + 1})`}
              </p>
            </div>

            <StartLessonButton 
              session={session}
              currentSkill={currentSkill}
              loading={loading}
            />

            <div className={styles.progressSection}>
              <p className={styles.progressLabel}>
                Progress: {currentLesson}/{totalSkills} skills
              </p>
              <div className={styles.progressBarContainer} role="progressbar" aria-valuenow={currentLesson} aria-valuemin={0} aria-valuemax={totalSkills} aria-label={`${currentLesson} of ${totalSkills} skills completed`}>
                <div 
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {user?.email && (
              <div className={styles.userEmail}>
                {user.email}
              </div>
            )}

            <Link href="/settings" className={styles.settingsBtn} aria-label="Settings">
              <SettingsIcon size={20} />
              Settings
            </Link>
          </>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireSetup={true}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
