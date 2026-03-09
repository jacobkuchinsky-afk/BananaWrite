'use client'

import { useState, useRef, useEffect } from 'react'
import { AppSettings } from '@/types'
import { updateAppSettings } from '@/lib/adminFirestore'
import styles from './Admin.module.css'

const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

interface SettingsPanelProps {
  settings: AppSettings
  onUpdate: (settings: AppSettings) => void
  userEmail: string
}

interface SettingConfig {
  key: keyof Pick<AppSettings, 'maxErrorsBeforeQuiz' | 'repeatedErrorThreshold' | 'targetWordCount' | 'maxWordCount' | 'quizPassingScore' | 'maxQuizQuestions' | 'minQuizSeverity'>
  label: string
  unit: string
  description: string
  min: number
  max: number
  step?: number
  formatLabel?: (v: number) => string
}

const SETTING_GROUPS: { title: string; settings: SettingConfig[] }[] = [
  {
    title: 'Error Handling',
    settings: [
      {
        key: 'maxErrorsBeforeQuiz',
        label: 'Max Errors Before Quiz',
        unit: 'errors',
        description: 'If total errors exceed this, users go straight to quiz with no redo option.',
        min: 1, max: 10
      },
      {
        key: 'repeatedErrorThreshold',
        label: 'Repeated Error Threshold',
        unit: 'instances',
        description: 'When a single error type appears this many times, force quiz mode (no redo).',
        min: 2, max: 10
      },
    ]
  },
  {
    title: 'Essay',
    settings: [
      {
        key: 'targetWordCount',
        label: 'Target Word Count',
        unit: 'words',
        description: 'Minimum number of words required before a student can submit their essay.',
        min: 100, max: 500, step: 25
      },
      {
        key: 'maxWordCount',
        label: 'Max Word Count',
        unit: 'words',
        description: 'Soft cap shown in the word counter. Essays beyond this are flagged as too long.',
        min: 300, max: 1000, step: 50
      },
    ]
  },
  {
    title: 'Quiz',
    settings: [
      {
        key: 'quizPassingScore',
        label: 'Passing Score',
        unit: '%',
        description: 'Minimum percentage score required to pass a quiz and advance.',
        min: 50, max: 100, step: 5,
        formatLabel: (v: number) => `${v}%`
      },
      {
        key: 'maxQuizQuestions',
        label: 'Max Questions',
        unit: 'questions',
        description: 'Upper limit on how many questions the AI can generate per quiz.',
        min: 3, max: 20
      },
      {
        key: 'minQuizSeverity',
        label: 'Min Quiz Severity',
        unit: 'severity',
        description: 'Errors below this severity are skipped when building quizzes. Set to 1 to quiz on everything.',
        min: 1, max: 5
      },
    ]
  }
]

export default function SettingsPanel({ settings, onUpdate, userEmail }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState({
    maxErrorsBeforeQuiz: settings.maxErrorsBeforeQuiz,
    repeatedErrorThreshold: settings.repeatedErrorThreshold,
    targetWordCount: settings.targetWordCount,
    maxWordCount: settings.maxWordCount,
    quizPassingScore: settings.quizPassingScore,
    maxQuizQuestions: settings.maxQuizQuestions,
    minQuizSeverity: settings.minQuizSeverity,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const hasChanges = (Object.keys(localSettings) as (keyof typeof localSettings)[]).some(
    k => localSettings[k] !== settings[k]
  )

  const handleChange = (key: keyof typeof localSettings, value: number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setSyncError(null)

    try {
      await updateAppSettings(localSettings, userEmail)

      try {
        const response = await fetch(`${FLASK_API_URL}/api/app-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repeatedErrorThreshold: localSettings.repeatedErrorThreshold,
            maxErrorsBeforeQuiz: localSettings.maxErrorsBeforeQuiz,
            quizPassingScore: localSettings.quizPassingScore,
            maxQuizQuestions: localSettings.maxQuizQuestions,
            minQuizSeverity: localSettings.minQuizSeverity,
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
      savedTimerRef.current = setTimeout(() => {
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

      {SETTING_GROUPS.map(group => (
        <div key={group.title} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 className={styles.chartTitle} style={{ marginBottom: 'var(--spacing-md)' }}>{group.title}</h3>
          <div className={styles.settingsGrid}>
            {group.settings.map(cfg => {
              const value = localSettings[cfg.key]
              const fmtMin = cfg.formatLabel ? cfg.formatLabel(cfg.min) : String(cfg.min)
              const fmtMax = cfg.formatLabel ? cfg.formatLabel(cfg.max) : String(cfg.max)

              return (
                <div key={cfg.key} className={styles.settingCard}>
                  <span className={styles.settingLabel}>{cfg.label}</span>
                  <div className={styles.settingValue}>
                    {value}
                    <span className={styles.settingUnit}>{cfg.unit}</span>
                  </div>
                  <p className={styles.settingDescription}>{cfg.description}</p>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step ?? 1}
                      value={value}
                      onChange={e => handleChange(cfg.key, parseInt(e.target.value))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>{fmtMin}</span>
                      <span>{fmtMax}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

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
