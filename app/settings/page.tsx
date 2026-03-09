'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import ProfilePicture from '@/components/Settings/ProfilePicture'
import NotificationHistory from '@/components/Settings/NotificationHistory'
import { CrazinessSelector, FocusSelector, EssayTypeSelector } from '@/components/Setup'
import { ArrowLeftIcon, SunIcon, MoonIcon } from '@/components/Icons/Icons'
import { useTheme } from '@/context/ThemeContext'
import { getUserSettings, updateUserSettings } from '@/lib/firestore'
import { CrazinessLevel, FocusTopic, EssayType, UserSettings, DIFFICULTY_LEVEL_LABELS } from '@/types'
import styles from '@/components/Settings/Settings.module.css'

function SettingsContent() {
  const { user, logout, resetPassword } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  
  // Password reset states
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')

  // Writing preferences states
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [editingCraziness, setEditingCraziness] = useState(false)
  const [editingFocus, setEditingFocus] = useState(false)
  const [editingEssayType, setEditingEssayType] = useState(false)
  const [tempCraziness, setTempCraziness] = useState<CrazinessLevel | null>(null)
  const [tempFocus, setTempFocus] = useState<FocusTopic | null>(null)
  const [tempEssayType, setTempEssayType] = useState<EssayType | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      if (!user) return
      try {
        const userSettings = await getUserSettings(user.uid)
        setSettings(userSettings)
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return

    setResetError('')
    setResetSuccess(false)
    setResetLoading(true)

    try {
      await resetPassword(user.email)
      setResetSuccess(true)
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/too-many-requests') {
        setResetError('Too many requests. Please try again later.')
      } else {
        setResetError('An error occurred. Please try again.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  const handleEditCraziness = () => {
    setTempCraziness(settings?.craziness || null)
    setEditingCraziness(true)
  }

  const handleEditFocus = () => {
    setTempFocus(settings?.focus || null)
    setEditingFocus(true)
  }

  const handleEditEssayType = () => {
    setTempEssayType(settings?.essayType || null)
    setEditingEssayType(true)
  }

  const handleSaveCraziness = async () => {
    if (!user || !tempCraziness || !settings) return
    setSavingSettings(true)
    try {
      await updateUserSettings(user.uid, tempCraziness, settings.focus, settings.essayType)
      setSettings({ ...settings, craziness: tempCraziness })
      setEditingCraziness(false)
    } catch (error) {
      console.error('Error saving craziness:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveFocus = async () => {
    if (!user || !tempFocus || !settings) return
    setSavingSettings(true)
    try {
      await updateUserSettings(user.uid, settings.craziness, tempFocus, settings.essayType)
      setSettings({ ...settings, focus: tempFocus })
      setEditingFocus(false)
    } catch (error) {
      console.error('Error saving focus:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveEssayType = async () => {
    if (!user || !tempEssayType || !settings) return
    setSavingSettings(true)
    try {
      await updateUserSettings(user.uid, settings.craziness, settings.focus, tempEssayType)
      setSettings({ ...settings, essayType: tempEssayType })
      setEditingEssayType(false)
    } catch (error) {
      console.error('Error saving essay type:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  // Get display name
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <div className={styles.settingsPage}>
      {/* Header */}
      <header className={styles.settingsHeader}>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeftIcon size={18} /> Back
        </Link>
        <h1 className={styles.settingsTitle}>Settings</h1>
        <div style={{ width: '80px' }} /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <main className={styles.settingsContent}>
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          
          <div className={styles.profileDisplaySection}>
            <ProfilePicture
              photoURL={user?.photoURL}
              displayName={displayName}
              size="large"
            />
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{displayName}</p>
              <p className={styles.profileEmail}>{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <p className={styles.sectionDescription}>
            Choose your preferred color theme
          </p>
          <div className={styles.themeToggleRow}>
            <button
              className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
              aria-pressed={theme === 'light'}
            >
              <SunIcon size={20} />
              <span>Light</span>
            </button>
            <button
              className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
              aria-pressed={theme === 'dark'}
            >
              <MoonIcon size={20} />
              <span>Dark</span>
            </button>
          </div>
        </section>

        {/* Password Reset Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <p className={styles.sectionDescription}>
            We&apos;ll send a password reset link to your email
          </p>
          
          <div className={styles.resetSection}>
            <div className={styles.emailDisplay}>
              {user?.email}
            </div>
            
            {resetSuccess ? (
              <div className={styles.successMessage}>
                Password reset email sent! Check your inbox for further instructions.
              </div>
            ) : (
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className={styles.resetButton}
              >
                {resetLoading ? <span className={styles.spinner} /> : 'Send Reset Link'}
              </button>
            )}
            
            {resetError && (
              <div className={styles.errorMessage}>
                {resetError}
              </div>
            )}
          </div>
        </section>

        {/* Writing Preferences Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Writing Preferences</h2>
          <p className={styles.sectionDescription}>
            Customize how your essay prompts are generated
          </p>

          <div className={styles.preferencesSection}>
            {/* Craziness Setting */}
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceLabel}>Prompt Craziness</div>
              {editingCraziness ? (
                <div className={styles.preferenceEditor}>
                  <CrazinessSelector 
                    value={tempCraziness} 
                    onChange={setTempCraziness} 
                  />
                  <div className={styles.editorActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setEditingCraziness(false)}
                      disabled={savingSettings}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveCraziness}
                      disabled={!tempCraziness || savingSettings}
                    >
                      {savingSettings ? <span className={styles.spinner} /> : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className={styles.preferenceValue}
                  onClick={handleEditCraziness}
                >
                  <span>{settings?.craziness || 'Not set'}</span>
                  <span className={styles.editHint}>Click to change</span>
                </button>
              )}
            </div>

            {/* Focus Setting */}
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceLabel}>Topic Focus</div>
              {editingFocus ? (
                <div className={styles.preferenceEditor}>
                  <FocusSelector 
                    value={tempFocus} 
                    onChange={setTempFocus} 
                  />
                  <div className={styles.editorActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setEditingFocus(false)}
                      disabled={savingSettings}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveFocus}
                      disabled={!tempFocus || savingSettings}
                    >
                      {savingSettings ? <span className={styles.spinner} /> : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className={styles.preferenceValue}
                  onClick={handleEditFocus}
                >
                  <span>{settings?.focus || 'Not set'}</span>
                  <span className={styles.editHint}>Click to change</span>
                </button>
              )}
            </div>

            {/* Essay Type Setting */}
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceLabel}>Essay Type</div>
              {editingEssayType ? (
                <div className={styles.preferenceEditor}>
                  <EssayTypeSelector 
                    value={tempEssayType} 
                    onChange={setTempEssayType} 
                  />
                  <div className={styles.editorActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setEditingEssayType(false)}
                      disabled={savingSettings}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveEssayType}
                      disabled={!tempEssayType || savingSettings}
                    >
                      {savingSettings ? <span className={styles.spinner} /> : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className={styles.preferenceValue}
                  onClick={handleEditEssayType}
                >
                  <span>{settings?.essayType || 'Not set'}</span>
                  <span className={styles.editHint}>Click to change</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Update History Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Update History</h2>
          <p className={styles.sectionDescription}>
            View past announcements and app updates
          </p>
          <NotificationHistory />
        </section>

        {/* Grade Level Info */}
        <section className={styles.gradeLevelSection}>
          <div className={styles.gradeLevelLabel}>Current Grade Level</div>
          <div className={styles.gradeLevelValue}>
            {settings?.difficultyLevel
              ? DIFFICULTY_LEVEL_LABELS[settings.difficultyLevel]
              : 'Not assigned'}
          </div>
        </section>

        {/* Sign Out Section */}
        <div className={styles.signOutSection}>
          <button onClick={handleLogout} className={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireSetup={false}>
      <SettingsContent />
    </ProtectedRoute>
  )
}
