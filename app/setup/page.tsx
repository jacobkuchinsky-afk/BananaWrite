'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CrazinessSelector, FocusSelector, EssayTypeSelector } from '@/components/Setup'
import { completeUserSetup, getUserSettings } from '@/lib/firestore'
import { CrazinessLevel, FocusTopic, EssayType } from '@/types'
import styles from '@/components/Setup/Setup.module.css'

type SetupStep = 'craziness' | 'focus' | 'essayType'

export default function SetupPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [step, setStep] = useState<SetupStep>('craziness')
  const [craziness, setCraziness] = useState<CrazinessLevel | null>(null)
  const [focus, setFocus] = useState<FocusTopic | null>(null)
  const [essayType, setEssayType] = useState<EssayType | null>(null)
  const [saving, setSaving] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)

  // Check if user is logged in and if setup is already complete
  useEffect(() => {
    async function checkSetupStatus() {
      if (authLoading) return
      
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const settings = await getUserSettings(user.uid)
        if (settings?.setupComplete) {
          // Already completed setup, redirect to dashboard
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking setup status:', error)
      }
      
      setCheckingSetup(false)
    }

    checkSetupStatus()
  }, [user, authLoading, router])

  const handleContinue = async () => {
    if (step === 'craziness' && craziness) {
      setStep('focus')
    } else if (step === 'focus' && focus) {
      setStep('essayType')
    } else if (step === 'essayType' && essayType && craziness && focus && user) {
      setSaving(true)
      try {
        await completeUserSetup(user.uid, craziness, focus, essayType)
        router.push('/dashboard')
      } catch (error) {
        console.error('Error saving settings:', error)
        setSaving(false)
      }
    }
  }

  const handleBack = () => {
    if (step === 'focus') {
      setStep('craziness')
    } else if (step === 'essayType') {
      setStep('focus')
    }
  }

  const canContinue = 
    step === 'craziness' ? !!craziness : 
    step === 'focus' ? !!focus : 
    !!essayType

  // Loading states
  if (authLoading || checkingSetup) {
    return (
      <div className={styles.setupPage}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={styles.setupPage}>
      <div className={styles.setupContainer}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${step === 'craziness' ? styles.active : styles.completed}`} />
          <div className={`${styles.stepDot} ${step === 'focus' ? styles.active : step === 'essayType' ? styles.completed : ''}`} />
          <div className={`${styles.stepDot} ${step === 'essayType' ? styles.active : ''}`} />
        </div>

        {/* Header */}
        <div className={styles.setupHeader}>
          {step === 'craziness' ? (
            <>
              <h1 className={styles.setupTitle}>How wild should your prompts be?</h1>
              <p className={styles.setupSubtitle}>
                Choose the level of creativity and unexpectedness for your essay prompts
              </p>
            </>
          ) : step === 'focus' ? (
            <>
              <h1 className={styles.setupTitle}>What topics interest you?</h1>
              <p className={styles.setupSubtitle}>
                Pick a focus area for your writing prompts
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.setupTitle}>What type of essays do you prefer?</h1>
              <p className={styles.setupSubtitle}>
                Choose between creative fiction or factual non-fiction writing
              </p>
            </>
          )}
        </div>

        {/* Content */}
        {step === 'craziness' ? (
          <CrazinessSelector value={craziness} onChange={setCraziness} />
        ) : step === 'focus' ? (
          <FocusSelector value={focus} onChange={setFocus} />
        ) : (
          <EssayTypeSelector value={essayType} onChange={setEssayType} />
        )}

        {/* Actions */}
        <div className={styles.setupActions}>
          {(step === 'focus' || step === 'essayType') && (
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              disabled={saving}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className={styles.continueButton}
            onClick={handleContinue}
            disabled={!canContinue || saving}
          >
            {saving ? (
              <span className={styles.spinner} />
            ) : step === 'essayType' ? (
              'Get Started'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


