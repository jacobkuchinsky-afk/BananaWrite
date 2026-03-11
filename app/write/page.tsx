'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useUserSession } from '@/hooks/useUserSession'
import { useStreamingPrompt } from '@/hooks/useStreamingPrompt'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import { calculateEssayXP } from '@/lib/xpCalculator'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import InteractiveLoader from '@/components/Loading/InteractiveLoader'
import PromptHeader from '@/components/Write/PromptHeader'
import WritingArea from '@/components/Write/WritingArea'
import WordCounter from '@/components/Write/WordCounter'
import SubmitButton from '@/components/Write/SubmitButton'
import MarkedEssay from '@/components/Write/MarkedEssay'
import { ModuleComplete, WinScreen } from '@/components/Quiz'
import { startQuizSession, completeLesson, resetSession, getQuizSession, getUserSettings } from '@/lib/firestore'
import { getAppSettings, incrementAnalytics } from '@/lib/adminFirestore'
import { UserSettings, AppSettings, DEFAULT_APP_SETTINGS, GRADE_WRITING_TECHNIQUES, DifficultyLevel } from '@/types'
import { ArrowLeftIcon, AlertIcon, RefreshIcon, BookIcon, MaximizeIcon, MinimizeIcon } from '@/components/Icons/Icons'
import { ContestButton } from '@/components/Contest'
import WritingGuidePanel from '@/components/Write/WritingGuidePanel'
import styles from '@/components/Write/Write.module.css'

// Count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

function WriteContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    progress, 
    session, 
    loading: sessionLoading,
    startWritingSession,
    saveEssayDraft,
    submitEssay
  } = useUserSession()
  
  const {
    streamedText,
    isStreaming,
    isComplete: promptComplete,
    startStreaming
  } = useStreamingPrompt()

  // Local state
  const [essayText, setEssayText] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [currentTechnique, setCurrentTechnique] = useState('')
  const [currentLesson, setCurrentLesson] = useState(0)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewingEssay, setIsReviewingEssay] = useState(false)
  const [showModuleComplete, setShowModuleComplete] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS as AppSettings)
  const [showMarkedEssay, setShowMarkedEssay] = useState(false)
  const [markedEssayData, setMarkedEssayData] = useState<{
    markedEssay: string
    errors: string[]
    problemCount: number
    forceQuiz: boolean
  } | null>(null)
  
  // Redo state - tracks if user has used their one chance to fix errors
  const [hasUsedRedoChance, setHasUsedRedoChance] = useState(false)
  const [originalErrors, setOriginalErrors] = useState<string[]>([])
  const [isRedoMode, setIsRedoMode] = useState(false)

  // Writing guide panel
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  // Focus mode
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Activity tracking for XP
  const { getActiveMinutes } = useActivityTracker()
  const [earnedEssayXP, setEarnedEssayXP] = useState(0)

  // Contest state for essay check
  const [essayCheckResponse, setEssayCheckResponse] = useState<string | null>(null)
  const [essayCheckContestConfirmed, setEssayCheckContestConfirmed] = useState(false)
  const [showEssayCheckLoadingGame, setShowEssayCheckLoadingGame] = useState(false)
  
  // Contest state for essay review
  const [essayReviewResponse, setEssayReviewResponse] = useState<string | null>(null)
  const [essayReviewContestConfirmed, setEssayReviewContestConfirmed] = useState(false)
  const [showEssayReviewLoadingGame, setShowEssayReviewLoadingGame] = useState(false)

  // Focus mode keyboard shortcut (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode])

  // Fetch user settings and app settings
  useEffect(() => {
    async function fetchSettings() {
      if (!user) return
      try {
        const [settings, globalSettings] = await Promise.all([
          getUserSettings(user.uid),
          getAppSettings()
        ])
        setUserSettings(settings)
        setAppSettings(globalSettings)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setSettingsLoaded(true)
      }
    }
    fetchSettings()
  }, [user])

  // Auto-save hook
  const { triggerSave, isSaving, lastSavedText } = useAutoSave({
    onSave: saveEssayDraft,
    interval: 30000, // 30 seconds
    debounceDelay: 2000 // 2 seconds after typing stops
  })

  // Initialize from session or generate new prompt
  useEffect(() => {
    // Wait for session loading and settings to be loaded before generating prompt
    if (sessionLoading || initialized || !user || !settingsLoaded) return

    const lessonIndex = progress?.currentLesson ?? 0
    setCurrentLesson(lessonIndex)
    const diffLevel = (userSettings?.difficultyLevel || 'proficient') as DifficultyLevel
    const techniques = GRADE_WRITING_TECHNIQUES[diffLevel]
    const technique = techniques[lessonIndex] || 'Commas'
    setCurrentTechnique(technique)

    // Check if we have an existing session with a prompt
    if (session?.essayPrompt && session.status === 'writing') {
      // Resume existing session
      setCurrentPrompt(session.essayPrompt)
      setEssayText(session.essayDraft || '')
      setWordCount(session.wordCount || 0)
      setInitialized(true)
    } else if (session?.status === 'submitted') {
      // Already submitted - check if there's a quiz session to resume
      setInitialized(true)
      
      getQuizSession(user.uid).then(async (quizSession) => {
        if (quizSession && quizSession.essayErrors && quizSession.essayErrors.length > 0 && quizSession.status !== 'complete') {
          // Has active quiz session - redirect to quiz
          router.push('/quiz')
        } else {
          // No quiz or quiz is complete - reset and start fresh
          await resetSession(user.uid)
          setIsGeneratingPrompt(true)
          
          startStreaming({
            lessonIndex,
            writingTechnique: technique,
            craziness: userSettings?.craziness,
            focus: userSettings?.focus,
            essayType: userSettings?.essayType,
            difficultyLevel: diffLevel
          })
            .then(async (fullPrompt) => {
              setCurrentPrompt(fullPrompt)
              await startWritingSession(technique, fullPrompt)
              setIsGeneratingPrompt(false)
            })
            .catch((err) => {
              console.error('Failed to generate prompt:', err)
              setIsGeneratingPrompt(false)
            })
        }
      }).catch((err) => {
        console.error('Error checking quiz session:', err)
        // On error, just start fresh
        setIsGeneratingPrompt(true)
        startStreaming({
          lessonIndex,
          writingTechnique: technique,
          craziness: userSettings?.craziness,
          focus: userSettings?.focus,
          essayType: userSettings?.essayType,
          difficultyLevel: diffLevel
        })
          .then(async (fullPrompt) => {
            setCurrentPrompt(fullPrompt)
            await startWritingSession(technique, fullPrompt)
            setIsGeneratingPrompt(false)
          })
          .catch((err2) => {
            console.error('Failed to generate prompt:', err2)
            setIsGeneratingPrompt(false)
          })
      })
      return // Exit early, the promise handlers will set state
    } else {
      // Need to generate a new prompt
      setIsGeneratingPrompt(true)
      setInitialized(true)
      
      startStreaming({
        lessonIndex,
        writingTechnique: technique,
        craziness: userSettings?.craziness,
        focus: userSettings?.focus,
        essayType: userSettings?.essayType,
        difficultyLevel: diffLevel
      })
        .then(async (fullPrompt) => {
          setCurrentPrompt(fullPrompt)
          // Save the prompt to session
          await startWritingSession(technique, fullPrompt)
          setIsGeneratingPrompt(false)
        })
        .catch((err) => {
          console.error('Failed to generate prompt:', err)
          setIsGeneratingPrompt(false)
        })
    }
  }, [sessionLoading, session, progress, user, initialized, startStreaming, startWritingSession, userSettings, settingsLoaded])

  // Update word count and trigger auto-save when essay changes
  const handleEssayChange = useCallback((text: string) => {
    setEssayText(text)
    const count = countWords(text)
    setWordCount(count)
    
    // Trigger auto-save
    triggerSave(text, count)
  }, [triggerSave])

  // Handle submit with optional correction feedback from contest
  const handleSubmit = async (checkCorrectionFeedback?: string, reviewCorrectionFeedback?: string) => {
    if (wordCount < appSettings.targetWordCount || isSubmitting || isChecking || !user) return

    setIsChecking(true)
    setFeedbackMessage(null)
    
    // Reset contest confirmed state when new submission happens
    if (!checkCorrectionFeedback) {
      setEssayCheckContestConfirmed(false)
    }
    if (!reviewCorrectionFeedback) {
      setEssayReviewContestConfirmed(false)
    }
    
    try {
      const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'
      
      const currentDifficulty = userSettings?.difficultyLevel || 'proficient'
      
      // First, check if the essay follows the prompt
      const checkResponse = await fetch(`${FLASK_API_URL}/api/check-essay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          essay: essayText,
          prompt: currentPrompt,
          correction_feedback: checkCorrectionFeedback,
          difficulty_level: currentDifficulty
        })
      })

      if (!checkResponse.ok) {
        throw new Error('Failed to check essay')
      }

      const checkResult = await checkResponse.json()
      
      if (!checkResult.correct) {
        // Essay doesn't follow prompt requirements - show feedback
        setFeedbackMessage(checkResult.feedback)
        setEssayCheckResponse(checkResult.feedback)  // Store for contest
        setEssayCheckContestConfirmed(false)  // Reset contest state for new feedback
        setIsChecking(false)
        return
      }

      // Essay follows prompt correctly - now review for learning errors
      setIsChecking(false)
      setIsSubmitting(true)
      setIsReviewingEssay(true)
      
      // Save final version and mark as submitted (with activity time for XP)
      const activeMinutes = getActiveMinutes()
      await saveEssayDraft(essayText, wordCount)
      await submitEssay(activeMinutes)
      
      // Choose the appropriate review endpoint based on whether this is a redo
      let reviewResponse
      if (isRedoMode && originalErrors.length > 0) {
        // Re-review with context of original errors
        reviewResponse = await fetch(`${FLASK_API_URL}/api/review-essay-redo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            essay: essayText,
            original_errors: originalErrors,
            difficulty_level: currentDifficulty
          })
        })
      } else {
        // First-time review (or re-review with correction feedback from contest)
        reviewResponse = await fetch(`${FLASK_API_URL}/api/review-essay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            essay: essayText,
            correction_feedback: reviewCorrectionFeedback,
            difficulty_level: currentDifficulty
          })
        })
      }

      if (!reviewResponse.ok) {
        throw new Error('Failed to review essay')
      }

      const reviewResult = await reviewResponse.json()
      
      if (!reviewResult.has_errors) {
        // No errors! Module complete - advance lesson
        incrementAnalytics('essaysSubmitted').catch(() => {})
        const essayXP = calculateEssayXP(wordCount, activeMinutes)
        setEarnedEssayXP(essayXP)
        await completeLesson(user.uid, currentLesson, essayXP)
        await resetSession(user.uid)
        setIsReviewingEssay(false)
        setShowModuleComplete(true)
      } else {
        // Has errors - start quiz session
        await startQuizSession(
          user.uid,
          essayText,
          reviewResult.errors,
          reviewResult.raw_response
        )

        // Track essay submission with error types (fire-and-forget)
        const errorTypes = reviewResult.errors
          .map((e: string) => e.split('~')[0].trim())
          .filter((t: string) => t.length > 0)
        incrementAnalytics('essaysSubmitted', { errorTypes }).catch(() => {})
        
        const errorCount = reviewResult.problem_count || reviewResult.errors.length
        const forceQuiz = reviewResult.force_quiz || false
        
        // ALWAYS show the review screen - never skip directly to quiz
        setMarkedEssayData({
          markedEssay: reviewResult.marked_essay || essayText,
          errors: reviewResult.errors,
          problemCount: errorCount,
          forceQuiz: forceQuiz
        })
        setOriginalErrors(reviewResult.errors)
        setEssayReviewResponse(reviewResult.raw_response)  // Store for contest
        setEssayReviewContestConfirmed(false)  // Reset contest state for new feedback
        setIsReviewingEssay(false)
        setShowMarkedEssay(true)
      }
    } catch (err) {
      console.error('Failed to submit:', err)
      setFeedbackMessage('An error occurred while checking your essay. Please try again.')
      setIsReviewingEssay(false)
    } finally {
      setIsSubmitting(false)
      setIsChecking(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push('/dashboard')
  }

  // Handle continue from marked essay to quiz
  const handleContinueToQuiz = () => {
    router.push('/quiz')
  }

  // Handle redo - user wants to fix their errors
  const handleRedo = () => {
    // Mark that user has used their redo chance
    setHasUsedRedoChance(true)
    setIsRedoMode(true)
    // Hide the marked essay view and return to writing
    setShowMarkedEssay(false)
    // Keep the markedEssayData so we can show error reference while editing
  }

  // Handle essay check contest success (AI was wrong - self-reviewer confirmed essay is correct)
  const handleEssayCheckContestSuccess = async (_correctionFeedback: string) => {
    // The self-reviewer (thinking model) has confirmed the essay meets requirements.
    // Trust that verdict and proceed directly - don't re-ask the main model that already failed.
    setFeedbackMessage(null)
    setEssayCheckResponse(null)
    setIsChecking(false)
    
    // Continue with the normal submit flow (essay review phase)
    handleSubmit()
  }

  // Handle essay check contest confirmed (AI was right)
  const handleEssayCheckContestConfirmed = () => {
    setEssayCheckContestConfirmed(true)
  }

  // Handle essay review contest success (AI was wrong - self-reviewer confirmed errors were not valid)
  const handleEssayReviewContestSuccess = async (_correctionFeedback: string) => {
    if (!user) return
    
    // The self-reviewer (thinking model) has confirmed the flagged errors were not actually errors.
    // Trust that verdict and complete the module - don't re-ask the main model that already failed.
    setIsReviewingEssay(true)
    setShowMarkedEssay(false)
    
    try {
      // No errors confirmed by self-reviewer - module complete
      const essayXP = calculateEssayXP(wordCount, getActiveMinutes())
      setEarnedEssayXP(essayXP)
      await completeLesson(user.uid, currentLesson, essayXP)
      await resetSession(user.uid)
      setIsReviewingEssay(false)
      setShowModuleComplete(true)
    } catch (err) {
      console.error('Failed to complete lesson after contest:', err)
      setIsReviewingEssay(false)
      setShowMarkedEssay(true)
    }
  }

  // Handle essay review contest confirmed (AI was right)
  const handleEssayReviewContestConfirmed = () => {
    setEssayReviewContestConfirmed(true)
  }

  // Handle regenerate prompt
  const handleRegeneratePrompt = async () => {
    if (!user || isGeneratingPrompt) return
    
    setIsGeneratingPrompt(true)
    setFeedbackMessage(null)
    
    try {
      const fullPrompt = await startStreaming({
        lessonIndex: currentLesson,
        writingTechnique: currentTechnique,
        craziness: userSettings?.craziness,
        focus: userSettings?.focus,
        essayType: userSettings?.essayType
      })
      
      setCurrentPrompt(fullPrompt)
      await startWritingSession(currentTechnique, fullPrompt)
      // Keep the essay text - user might want to adapt their essay
    } catch (err) {
      console.error('Failed to regenerate prompt:', err)
      setFeedbackMessage('Failed to regenerate prompt. Please try again.')
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  // Show loading screen while checking essay follows prompt
  if (isChecking) {
    return (
      <InteractiveLoader
        title="Checking your essay..."
        subtitle="Making sure it follows the prompt"
      />
    )
  }

  // Show loading screen while generating prompt
  if (isGeneratingPrompt || (isStreaming && !currentPrompt)) {
    return (
      <InteractiveLoader
        title="Crafting your prompt..."
        subtitle="Move your mouse to play with the orbs"
        streamedText={streamedText}
        isStreaming={isStreaming}
      />
    )
  }

  // Show loading screen while reviewing essay
  if (isReviewingEssay) {
    return (
      <InteractiveLoader
        title="Reviewing your essay..."
        subtitle="Checking for areas to improve"
      />
    )
  }

  // Show loading game for essay check self-review
  if (showEssayCheckLoadingGame) {
    return (
      <InteractiveLoader
        title="Verifying your feedback..."
        subtitle="A second AI is reviewing the check"
      />
    )
  }

  // Show loading game for essay review self-review
  if (showEssayReviewLoadingGame) {
    return (
      <InteractiveLoader
        title="Verifying the errors..."
        subtitle="A second AI is reviewing the feedback"
      />
    )
  }

  // Show marked essay with errors highlighted
  if (showMarkedEssay && markedEssayData) {
    // Can only redo if: haven't used redo chance, not force_quiz, and errors within threshold
    const canRedo = !hasUsedRedoChance && !markedEssayData.forceQuiz && markedEssayData.problemCount <= appSettings.maxErrorsBeforeQuiz
    
    return (
      <MarkedEssay
        markedEssay={markedEssayData.markedEssay}
        errors={markedEssayData.errors}
        problemCount={markedEssayData.problemCount}
        canRedo={canRedo}
        maxErrorsBeforeQuiz={appSettings.maxErrorsBeforeQuiz}
        onContinue={handleContinueToQuiz}
        onRedo={handleRedo}
        // Contest props
        essayText={essayText}
        essayReviewResponse={essayReviewResponse}
        onContestSuccess={handleEssayReviewContestSuccess}
        onContestConfirmed={handleEssayReviewContestConfirmed}
        contestConfirmed={essayReviewContestConfirmed}
        // User info for bug reports
        userId={user?.uid}
        userEmail={user?.email || undefined}
        displayName={user?.displayName}
        // Loading game props
        onShowLoadingGame={() => setShowEssayReviewLoadingGame(true)}
        onLoadingComplete={() => setShowEssayReviewLoadingGame(false)}
      />
    )
  }

  // Show win screen for perfect essay (no errors)
  if (showModuleComplete) {
    return (
      <WinScreen
        variant="perfect_essay"
        xpEarned={earnedEssayXP}
        lessonName={currentTechnique}
      />
    )
  }

  // Show loading while session loads
  if (sessionLoading) {
    return (
      <div className={styles.writePage}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Extract only the error snippets from the marked essay (for redo reference)
  const extractErrorSnippets = (text: string) => {
    const segments = text.split('¦')
    // Only odd indices are errors (text between ¦ markers)
    return segments
      .filter((_, index) => index % 2 === 1)
      .filter(snippet => snippet.trim().length > 0)
  }

  // Parse marked essay to show full essay with highlights
  const parseMarkedEssay = (text: string) => {
    const segments = text.split('¦')
    return segments.map((segment, index) => ({
      text: segment,
      isError: index % 2 === 1
    }))
  }

  return (
    <div className={`${styles.writePage} ${isFocusMode ? styles.focusMode : ''}`}>
      {/* Focus mode floating controls */}
      {isFocusMode && (
        <>
          <button
            className={styles.focusExitBtn}
            onClick={() => setIsFocusMode(false)}
            aria-label="Exit focus mode"
          >
            <MinimizeIcon size={16} />
            <span>Exit Focus</span>
          </button>
          <div className={styles.focusWordCount}>
            {wordCount} / {appSettings.targetWordCount} words
          </div>
          <div className={styles.focusSaveStatus}>
            <span className={`${styles.focusSaveDot} ${isSaving ? styles.saving : ''}`} />
          </div>
        </>
      )}

      {/* Header */}
      <header className={styles.writeHeader}>
        <button onClick={handleBack} className={styles.backBtn}>
          <ArrowLeftIcon size={18} />
          Back
        </button>
        <div className={styles.saveStatus}>
          <span className={`${styles.saveIndicator} ${isSaving ? styles.saving : ''}`} />
          <span>{isSaving ? 'Saving...' : lastSavedText || 'Auto-save enabled'}</span>
        </div>
      </header>

      {/* Redo Mode Banner */}
      {isRedoMode && markedEssayData && (
        <div className={styles.redoBanner}>
          <span className={styles.redoBannerIcon}>✏️</span>
          <div className={styles.redoBannerText}>
            <p className={styles.redoBannerTitle}>Fix Your Errors</p>
            <p className={styles.redoBannerSubtitle}>
              Make your corrections below. The original errors are shown on the right for reference.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.writeContent}>
        {/* Prompt */}
        <div className={styles.promptSection}>
          <PromptHeader 
            prompt={currentPrompt}
            writingTechnique={currentTechnique}
          />
          {!isRedoMode && (
            <div className={styles.promptActions}>
              <button 
                onClick={handleRegeneratePrompt}
                className={styles.regenerateBtn}
                disabled={isGeneratingPrompt}
                title="Generate a new prompt"
              >
                <RefreshIcon size={18} />
                New Prompt
              </button>
              <button
                onClick={() => setIsGuideOpen(true)}
                className={styles.guideBtn}
                title="Writing guide"
              >
                <BookIcon size={18} />
                Guide
              </button>
              <button
                onClick={() => setIsFocusMode(true)}
                className={styles.focusBtn}
                title="Focus mode (Escape to exit)"
              >
                <MaximizeIcon size={18} />
                Focus
              </button>
            </div>
          )}
        </div>

        {/* Redo Mode: Show writing area with error reference side panel */}
        {isRedoMode && markedEssayData ? (
          <div className={styles.redoModeContainer}>
            <div className={styles.redoWritingSection}>
              {/* Writing Area */}
              <WritingArea
                value={essayText}
                onChange={handleEssayChange}
                placeholder="Fix the errors in your essay..."
              />

              {/* Word Counter */}
              <WordCounter 
                wordCount={wordCount}
                targetWords={appSettings.targetWordCount}
                maxWords={appSettings.maxWordCount}
              />
            </div>

            {/* Error Reference Panel - Shows error snippets AND full essay with highlights */}
            <div className={styles.redoErrorReference}>
              {/* Error Snippets Summary */}
              <div className={styles.errorSnippetsSection}>
                <h3 className={styles.redoErrorReferenceTitle}>Errors to Fix ({extractErrorSnippets(markedEssayData.markedEssay).length})</h3>
                <ul className={styles.errorSnippetList}>
                  {extractErrorSnippets(markedEssayData.markedEssay).map((snippet, index) => (
                    <li key={index} className={styles.errorSnippetItem}>
                      <span className={styles.errorSnippetNumber}>{index + 1}</span>
                      <span className={styles.errorSnippetText}>{snippet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Essay with Highlights */}
              <div className={styles.markedEssaySection}>
                <h4 className={styles.markedEssaySectionTitle}>Your Essay (with errors highlighted)</h4>
                <div className={styles.redoMarkedPreview}>
                  {parseMarkedEssay(markedEssayData.markedEssay).map((segment, index) => (
                    segment.isError ? (
                      <span key={index} className={styles.errorHighlight}>
                        {segment.text}
                      </span>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Normal Mode: Standard writing area */}
            <WritingArea
              value={essayText}
              onChange={handleEssayChange}
              placeholder="Start writing your essay here..."
            />

            {/* Word Counter */}
            <WordCounter 
              wordCount={wordCount}
              targetWords={appSettings.targetWordCount}
              maxWords={appSettings.maxWordCount}
            />
          </>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className={styles.feedbackSection}>
            <div className={styles.feedbackIcon}>
              <AlertIcon size={24} />
            </div>
            <div className={styles.feedbackContent}>
              <p className={styles.feedbackTitle}>Almost there!</p>
              <p className={styles.feedbackText}>{feedbackMessage}</p>
              {/* Contest button for essay check */}
              {essayCheckResponse && (
                <div style={{ marginTop: '1rem' }}>
                  <ContestButton
                    contextType="essay_check"
                    originalResponse={essayCheckResponse}
                    userContent={essayText}
                    originalPrompt={currentPrompt}
                    onContestSuccess={handleEssayCheckContestSuccess}
                    onContestConfirmed={handleEssayCheckContestConfirmed}
                    disabled={isChecking || essayCheckContestConfirmed}
                    userId={user?.uid}
                    userEmail={user?.email || undefined}
                    displayName={user?.displayName}
                    onShowLoadingGame={() => setShowEssayCheckLoadingGame(true)}
                    onLoadingComplete={() => setShowEssayCheckLoadingGame(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <SubmitButton
          wordCount={wordCount}
          targetWords={appSettings.targetWordCount}
          onSubmit={handleSubmit}
          loading={isSubmitting || isChecking}
        />
      </main>

      <WritingGuidePanel
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        writingTechnique={currentTechnique}
        difficultyLevel={(userSettings?.difficultyLevel || 'proficient') as DifficultyLevel}
      />
    </div>
  )
}

export default function WritePage() {
  return (
    <ProtectedRoute requireSetup={true}>
      <WriteContent />
    </ProtectedRoute>
  )
}
