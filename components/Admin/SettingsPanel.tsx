'use client'

import { useState } from 'react'
import { AppSettings } from '@/types'
import { updateAppSettings } from '@/lib/adminFirestore'
import styles from './Admin.module.css'

const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

interface SettingsPanelProps {
  settings: AppSettings
  onUpdate: (settings: AppSettings) => void
  userEmail: string
}

export default function SettingsPanel({ settings, onUpdate, userEmail }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState({
    maxErrorsForRedo: settings.maxErrorsForRedo,
    sameErrorQuizThreshold: settings.sameErrorQuizThreshold,
    totalErrorQuizThreshold: settings.totalErrorQuizThreshold,
    quizPassingScore: settings.quizPassingScore
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const hasChanges = 
    localSettings.maxErrorsForRedo !== settings.maxErrorsForRedo ||
    localSettings.sameErrorQuizThreshold !== settings.sameErrorQuizThreshold ||
    localSettings.totalErrorQuizThreshold !== settings.totalErrorQuizThreshold ||
    localSettings.quizPassingScore !== settings.quizPassingScore

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSyncError(null)

    try {
      // Save to Firestore
      await updateAppSettings(localSettings, userEmail)
      
      // Sync to backend API so the AI service uses the updated thresholds
      try {
        const response = await fetch(`${FLASK_API_URL}/api/app-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sameErrorQuizThreshold: localSettings.sameErrorQuizThreshold,
            totalErrorQuizThreshold: localSettings.totalErrorQuizThreshold,
            quizPassingScore: localSettings.quizPassingScore
          })
        })
        
        if (!response.ok) {
          console.warn('Backend sync failed, settings saved to Firestore only')
          setSyncError('Settings saved but backend sync failed. Settings will take effect on next server restart.')
        }
      } catch (backendError) {
        console.warn('Could not sync to backend:', backendError)
        setSyncError('Settings saved but backend sync failed. Settings will take effect on next server restart.')
      }
      
      onUpdate({
        ...settings,
        ...localSettings,
        updatedAt: new Date() as unknown as typeof settings.updatedAt,
        updatedBy: userEmail
      })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setSyncError(null)
      }, 5000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatLastUpdated = () => {
    if (!settings.updatedAt) return 'Never'
    const date = settings.updatedAt.toDate ? settings.updatedAt.toDate() : new Date(settings.updatedAt as unknown as string)
    return date.toLocaleString()
  }

  return (
    <div className={styles.settingsSection}>
      <h2 className={styles.sectionTitle}>App Configuration</h2>
      <p className={styles.sectionDescription}>
        Configure thresholds and settings that control the app behavior for all users.
      </p>

      <div className={styles.settingsGrid}>
        {/* Max Errors for Redo */}
        <div className={styles.settingCard}>
          <span className={styles.settingLabel}>Max Errors for Redo</span>
          <div className={styles.settingValue}>
            {localSettings.maxErrorsForRedo}
            <span className={styles.settingUnit}>errors</span>
          </div>
          <p className={styles.settingDescription}>
            Maximum number of errors that allows users to fix their essay instead of going directly to quiz.
          </p>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="1"
              max="10"
              value={localSettings.maxErrorsForRedo}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                maxErrorsForRedo: parseInt(e.target.value)
              }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Same Error Quiz Threshold */}
        <div className={styles.settingCard}>
          <span className={styles.settingLabel}>Same Error Threshold</span>
          <div className={styles.settingValue}>
            {localSettings.sameErrorQuizThreshold}
            <span className={styles.settingUnit}>instances</span>
          </div>
          <p className={styles.settingDescription}>
            When a single error type appears this many times, force quiz mode (no redo option).
          </p>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="2"
              max="10"
              value={localSettings.sameErrorQuizThreshold}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                sameErrorQuizThreshold: parseInt(e.target.value)
              }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>2</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Total Error Quiz Threshold */}
        <div className={styles.settingCard}>
          <span className={styles.settingLabel}>Total Error Threshold</span>
          <div className={styles.settingValue}>
            {localSettings.totalErrorQuizThreshold}
            <span className={styles.settingUnit}>total</span>
          </div>
          <p className={styles.settingDescription}>
            When total errors exceed this number, force quiz mode regardless of error types.
          </p>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="3"
              max="15"
              value={localSettings.totalErrorQuizThreshold}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                totalErrorQuizThreshold: parseInt(e.target.value)
              }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>3</span>
              <span>15</span>
            </div>
          </div>
        </div>

        {/* Quiz Passing Score */}
        <div className={styles.settingCard}>
          <span className={styles.settingLabel}>Quiz Passing Score</span>
          <div className={styles.settingValue}>
            {localSettings.quizPassingScore}
            <span className={styles.settingUnit}>%</span>
          </div>
          <p className={styles.settingDescription}>
            Minimum percentage score required to pass a quiz and move forward.
          </p>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={localSettings.quizPassingScore}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                quizPassingScore: parseInt(e.target.value)
              }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.saveSection}>
        <span className={styles.lastUpdated}>
          Last updated: {formatLastUpdated()}
          {settings.updatedBy && ` by ${settings.updatedBy}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {saved && !syncError && (
              <span className={styles.successMessage}>
                Settings saved and synced to backend
              </span>
            )}
            {saved && syncError && (
              <span className={styles.warningMessage} style={{ color: '#f59e0b', fontSize: '0.875rem' }}>
                {syncError}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={styles.saveButton}
            >
              {saving ? (
                <>
                  <span className={styles.spinner} style={{ width: 16, height: 16 }}></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
