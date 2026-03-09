'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import InteractiveLoader from '@/components/Loading/InteractiveLoader'
import {
  QuizProgress,
  QuizQuestion,
  QuizResults,
  FeedbackCard,
  MemoryHooks,
  ModuleComplete,
  WriteAnotherEssay,
  WinScreen
} from '@/components/Quiz'
import {
  getQuizSession,
  setQuizRequirements,
  setCurrentQuiz,
  submitQuizAnswer,
  saveQuizResults,
  saveQuizHistoryEntry,
  saveTeacherFeedback,
  advanceFeedbackIndex,
  markTopicLearned,
  resetQuizForRetry,
  completeQuizSession,
  clearQuizSession,
  completeLesson,
  resetSession,
  getUserProgress
} from '@/lib/firestore'
import { getAppSettings, incrementAnalytics } from '@/lib/adminFirestore'
import { 
  QuizSession, 
  QuizQuestion as QuizQuestionType,
  QuizAnswer,
  QuizGradingResult,
  TeacherFeedback,
  TeacherChatContext,
  GRADE_WRITING_TECHNIQUES,
  DifficultyLevel,
  UserSettings
} from '@/types'
import { getUserSettings } from '@/lib/firestore'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons/Icons'
import { TeacherChat, TeacherChatRef } from '@/components/TeacherChat'
import styles from '@/components/Quiz/Quiz.module.css'

const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000'

type QuizPhase = 
  | 'loading' 
  | 'generating_requirements' 
  | 'generating_quiz'
  | 'answering'
  | 'grading'
  | 'results'
  | 'generating_feedback'
  | 'feedback'
  | 'memory_hooks'
  | 'all_topics_done'
  | 'module_complete'
  | 'error'

function QuizContent() {
  const router = useRouter()
  const { user } = useAuth()
  
  // State
  const [quizSession, setQuizSessionState] = useState<QuizSession | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [currentLesson, setCurrentLesson] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Feedback navigation state
  const [feedbackIndex, setFeedbackIndex] = useState(0)
  
  // Contest state for quiz grading
  const [quizGradeContestConfirmed, setQuizGradeContestConfirmed] = useState(false)
  const [showQuizGradeLoadingGame, setShowQuizGradeLoadingGame] = useState(false)
  
  // User settings for difficulty level
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const difficultyLevel = (userSettings?.difficultyLevel || 'proficient') as DifficultyLevel
  
  // Guard ref to prevent duplicate API calls during generation
  const isGenerating = useRef(false)
  
  // Ref to control teacher chat
  const teacherChatRef = useRef<TeacherChatRef>(null)
  
  // Build teacher chat context from quiz session
  // Include the current feedback explanation when viewing feedback
  const teacherChatContext: TeacherChatContext = useMemo(() => {
    if (!quizSession) {
      return {
        topic: '',
        wrongAnswers: [],
        feedbackExplanations: [],
        currentFeedback: '',
        memoryHooks: []
      }
    }
    
    // Get wrong answers from user answers (comparing with correct answers)
    const wrongAnswers = quizSession.userAnswers
      ?.filter(answer => {
        // Simple check - if they don't match exactly, it's wrong
        // The grading results will have the actual check
        return answer.userAnswer.toLowerCase().trim() !== answer.correctAnswer.toLowerCase().trim()
      })
      .map(answer => ({
        question: answer.question,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer
      })) || []
    
    // Get the current feedback explanation being viewed
    const currentFeedback = quizSession.teacherFeedback?.explanations?.[feedbackIndex] || ''
    
    return {
      topic: quizSession.currentQuizRequirements?.topic || '',
      wrongAnswers,
      feedbackExplanations: quizSession.teacherFeedback?.explanations || [],
      currentFeedback,
      memoryHooks: quizSession.teacherFeedback?.memoryHooks || []
    }
  }, [quizSession, feedbackIndex])
  
  // Load quiz session on mount
  useEffect(() => {
    async function loadQuizSession() {
      if (!user) return
      
      try {
        // Sync app settings to backend before any quiz operations
        // This ensures passing score threshold is correct even if backend restarted
        try {
          const appSettings = await getAppSettings()
          const syncResponse = await fetch(`${FLASK_API_URL}/api/app-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repeatedErrorThreshold: appSettings.repeatedErrorThreshold,
              maxErrorsBeforeQuiz: appSettings.maxErrorsBeforeQuiz,
              quizPassingScore: appSettings.quizPassingScore,
              maxQuizQuestions: appSettings.maxQuizQuestions
            })
          })
          if (!syncResponse.ok) {
            console.warn('[Quiz] Backend settings sync failed:', syncResponse.status)
          }
        } catch (syncError) {
          console.warn('[Quiz] Could not sync settings to backend:', syncError)
        }
        
        // Fetch user settings for difficulty level
        try {
          const settings = await getUserSettings(user.uid)
          if (settings) setUserSettings(settings)
        } catch (settingsError) {
          console.warn('[Quiz] Could not fetch user settings:', settingsError)
        }
        
        const session = await getQuizSession(user.uid)
        
        if (!session || !session.essayErrors || session.essayErrors.length === 0) {
          // No quiz session, redirect to dashboard
          router.push('/dashboard')
          return
        }
        
        setQuizSessionState(session)
        
        // Determine current phase based on session state
        if (session.status === 'complete') {
          setPhase('all_topics_done')
        } else if (session.status === 'feedback' && session.teacherFeedback) {
          setPhase('feedback')
          setFeedbackIndex(session.currentFeedbackIndex)
        } else if (session.status === 'grading' && session.quizResults) {
          if (session.quizResults.passed) {
            // Check if there are more topics
            setPhase('results')
          } else {
            setPhase('results')
          }
        } else if (session.currentQuiz && session.currentQuiz.questions.length > 0) {
          // Resume quiz
          if (session.currentQuestionIndex >= session.currentQuiz.questions.length) {
            // All questions answered, need grading
            setPhase('grading')
          } else {
            setPhase('answering')
          }
        } else if (session.currentQuizRequirements) {
          // Have requirements, need to generate quiz
          setPhase('generating_quiz')
        } else {
          // Need to get quiz requirements
          setPhase('generating_requirements')
        }
      } catch (err) {
        console.error('Error loading quiz session:', err)
        setError('Failed to load quiz session')
        setPhase('error')
      }
    }
    
    loadQuizSession()
  }, [user, router])
  
  // Generate quiz requirements
  const generateQuizRequirements = useCallback(async () => {
    if (!user || !quizSession) return
    
    setPhase('generating_requirements')
    
    try {
      const response = await fetch(`${FLASK_API_URL}/api/get-quiz-requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay_errors: quizSession.rawErrorsResponse,
          learned_topics: quizSession.learnedTopics,
          difficulty_level: difficultyLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.completed) {
        // All topics learned! Time for another essay
        await completeQuizSession(user.uid)
        // Update local state to reflect completion
        setQuizSessionState(prev => prev ? {
          ...prev,
          status: 'complete' as const
        } : null)
        setPhase('all_topics_done')
        return
      }
      
      // Save requirements
      await setQuizRequirements(user.uid, {
        topic: data.topic,
        questionType: data.question_type,
        questionCount: data.question_count
      })
      
      // Update local state
      setQuizSessionState(prev => prev ? {
        ...prev,
        currentQuizRequirements: {
          topic: data.topic,
          questionType: data.question_type,
          questionCount: data.question_count
        }
      } : null)
      
      setPhase('generating_quiz')
    } catch (err) {
      console.error('Error generating quiz requirements:', err)
      setError('Failed to generate quiz requirements')
      setPhase('error')
    } finally {
      isGenerating.current = false
    }
  }, [user, quizSession])
  
  // Generate quiz questions
  const generateQuiz = useCallback(async () => {
    if (!user || !quizSession?.currentQuizRequirements) return
    
    setPhase('generating_quiz')
    
    try {
      const { topic, questionType, questionCount } = quizSession.currentQuizRequirements
      
      const response = await fetch(`${FLASK_API_URL}/api/create-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          question_type: questionType,
          question_count: questionCount,
          last_quiz_results: quizSession.lastQuizResults || '',
          difficulty_level: difficultyLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Convert questions to our format
      const questions: QuizQuestionType[] = (data.questions || []).map((q: { question: string; correct_answer: string }) => ({
        question: q.question,
        correctAnswer: q.correct_answer
      }))
      
      // Check if we got valid questions
      if (questions.length === 0) {
        setError('Failed to generate quiz questions. Please try again.')
        setPhase('error')
        return
      }
      
      // Save quiz
      await setCurrentQuiz(user.uid, data.name || 'Quiz', questions)
      
      // Update local state
      setQuizSessionState(prev => prev ? {
        ...prev,
        currentQuiz: {
          name: data.name || 'Quiz',
          questions
        },
        currentQuestionIndex: 0,
        userAnswers: []
      } : null)
      
      setPhase('answering')
    } catch (err) {
      console.error('Error generating quiz:', err)
      setError('Failed to generate quiz')
      setPhase('error')
    } finally {
      isGenerating.current = false
    }
  }, [user, quizSession])
  
  // Handle answer submission
  const handleAnswerSubmit = async (answer: string) => {
    if (!user || !quizSession?.currentQuiz || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const currentQuestion = quizSession.currentQuiz.questions[quizSession.currentQuestionIndex]
      
      const quizAnswer: QuizAnswer = {
        userAnswer: answer,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswer
      }
      
      // Save answer
      await submitQuizAnswer(user.uid, quizAnswer)
      
      const newAnswers = [...quizSession.userAnswers, quizAnswer]
      const newIndex = quizSession.currentQuestionIndex + 1
      
      // Update local state
      setQuizSessionState(prev => prev ? {
        ...prev,
        userAnswers: newAnswers,
        currentQuestionIndex: newIndex
      } : null)
      
      // Check if quiz is complete
      if (newIndex >= quizSession.currentQuiz.questions.length) {
        setPhase('grading')
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      setError('Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Grade quiz (with optional correction feedback from contest)
  const gradeQuiz = useCallback(async (correctionFeedback?: string) => {
    if (!user || !quizSession) return
    
    setPhase('grading')
    
    // Reset contest confirmed state when new grading happens (unless this is a re-grade)
    if (!correctionFeedback) {
      setQuizGradeContestConfirmed(false)
    }
    
    try {
      // Format answers for API
      const answers = quizSession.userAnswers.map(a => ({
        user_answer: a.userAnswer,
        question: a.question,
        correct_answer: a.correctAnswer
      }))
      
      const response = await fetch(`${FLASK_API_URL}/api/grade-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers,
          correction_feedback: correctionFeedback,
          difficulty_level: difficultyLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      const results: QuizGradingResult = {
        score: data.score,
        feedback: data.feedback,
        passed: data.passed
      }
      
      // Save results
      await saveQuizResults(user.uid, results)

      // Save quiz history for teacher progress tracking (fire-and-forget)
      if (quizSession) {
        const techniques = GRADE_WRITING_TECHNIQUES[difficultyLevel]
        const technique = techniques[currentLesson] || 'Unknown'
        saveQuizHistoryEntry(user.uid, quizSession, results, currentLesson, technique).catch(() => {})
      }

      // Track quiz completion in analytics (fire-and-forget)
      incrementAnalytics('quizzesCompleted', { quizScore: data.score }).catch(() => {})
      if (data.passed) {
        incrementAnalytics('quizzesPassed').catch(() => {})
      }
      
      // Update local state
      setQuizSessionState(prev => prev ? {
        ...prev,
        quizResults: results,
        lastQuizResults: data.feedback
      } : null)
      
      // Reset contest state for new results (user can contest again)
      setQuizGradeContestConfirmed(false)
      
      setPhase('results')
    } catch (err) {
      console.error('Error grading quiz:', err)
      setError('Failed to grade quiz')
      setPhase('error')
    } finally {
      isGenerating.current = false
    }
  }, [user, quizSession])
  
  // Get teacher feedback
  const getTeacherFeedbackAction = useCallback(async () => {
    if (!user || !quizSession?.quizResults) return
    
    // Show loading screen while generating feedback
    setPhase('generating_feedback')
    
    try {
      // Build full answers array with question context for the teacher
      const answersWithContext = quizSession.userAnswers?.map(a => ({
        user_answer: a.userAnswer,
        question: a.question,
        correct_answer: a.correctAnswer
      })) || []
      
      const response = await fetch(`${FLASK_API_URL}/api/get-teacher-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades_feedback: quizSession.quizResults.feedback,
          answers: answersWithContext,
          difficulty_level: difficultyLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      
      const feedback: TeacherFeedback = {
        explanations: data.explanations,
        memoryHooks: data.memory_hooks
      }
      
      // Save feedback
      await saveTeacherFeedback(user.uid, feedback)
      
      // Update local state
      setQuizSessionState(prev => prev ? {
        ...prev,
        teacherFeedback: feedback,
        currentFeedbackIndex: 0
      } : null)
      
      setFeedbackIndex(0)
      setPhase('feedback')
    } catch (err) {
      console.error('Error getting teacher feedback:', err)
      setError('Failed to get feedback')
    }
  }, [user, quizSession])
  
  // Handle results continue
  const handleResultsContinue = async () => {
    if (!quizSession?.quizResults || !user) return
    
    if (quizSession.quizResults.passed) {
      // Mark topic as learned
      const currentTopic = quizSession.currentQuizRequirements?.topic || ''
      
      if (currentTopic) {
        await markTopicLearned(user.uid, currentTopic)
      }
      
      // Update local state - clear current quiz for next round
      // Use functional update to compute updatedLearnedTopics from fresh state
      setQuizSessionState(prev => {
        if (!prev) return null
        const updatedLearnedTopics = currentTopic 
          ? [...prev.learnedTopics, currentTopic]
          : prev.learnedTopics
        return {
          ...prev,
          learnedTopics: updatedLearnedTopics,
          currentQuiz: null,
          currentQuizRequirements: null,
          currentQuestionIndex: 0,
          userAnswers: [],
          quizResults: null
        }
      })
      
      // Let useEffect handle generating requirements - it will see 
      // phase='generating_requirements' and !currentQuizRequirements
      // and trigger generateQuizRequirements() with the updated learnedTopics
      setPhase('generating_requirements')
    } else {
      // Failed - get teacher feedback
      await getTeacherFeedbackAction()
    }
  }
  
  // Handle feedback navigation
  const handleNextFeedback = async () => {
    if (!user || !quizSession?.teacherFeedback) return
    
    const newIndex = feedbackIndex + 1
    
    if (newIndex >= quizSession.teacherFeedback.explanations.length) {
      setPhase('memory_hooks')
    } else {
      await advanceFeedbackIndex(user.uid)
      setFeedbackIndex(newIndex)
    }
  }
  
  const handlePreviousFeedback = () => {
    if (feedbackIndex > 0) {
      setFeedbackIndex(feedbackIndex - 1)
    }
  }
  
  const handleFinishFeedback = () => {
    setPhase('memory_hooks')
  }
  
  // Handle retry quiz
  const handleRetryQuiz = async () => {
    if (!user || !quizSession) return
    
    await resetQuizForRetry(user.uid)
    
    // Reset local state and keep currentQuizRequirements
    // Use functional update to ensure we're working with fresh state
    setQuizSessionState(prev => prev ? {
      ...prev,
      currentQuiz: null,
      currentQuestionIndex: 0,
      userAnswers: [],
      quizResults: null,
      teacherFeedback: null,
      currentFeedbackIndex: 0,
      status: 'reviewing' as const
    } : null)
    
    // Let useEffect handle the quiz generation - it will see phase='generating_quiz' 
    // and currentQuiz=null and trigger generateQuiz()
    setPhase('generating_quiz')
  }
  
  // Handle quiz grade contest success (AI was wrong - self-reviewer confirmed grading was incorrect)
  const handleQuizGradeContestSuccess = async (_correctionFeedback: string) => {
    if (!user || !quizSession) return
    
    // The self-reviewer (thinking model) has confirmed the grading was incorrect.
    // Trust that verdict and mark the quiz as passed - don't re-grade with the main model that already failed.
    const correctedResults: QuizGradingResult = {
      score: 100,  // Self-reviewer confirmed answers were correct
      feedback: 'Quiz passed after review confirmed correct answers.',
      passed: true
    }
    
    // Save corrected results
    await saveQuizResults(user.uid, correctedResults)

    // Track corrected quiz as passed (fire-and-forget)
    incrementAnalytics('quizzesPassed').catch(() => {})
    
    // Update local state with corrected results
    setQuizSessionState(prev => prev ? {
      ...prev,
      quizResults: correctedResults,
      lastQuizResults: correctedResults.feedback
    } : null)
    
    setPhase('results')
  }

  // Handle quiz grade contest confirmed (AI was right)
  const handleQuizGradeContestConfirmed = () => {
    setQuizGradeContestConfirmed(true)
  }

  // Format answers for the contest button
  const getFormattedAnswersForContest = () => {
    if (!quizSession?.userAnswers || quizSession.userAnswers.length === 0) {
      return 'No answer data available'  // Fallback so bug report can still be saved
    }
    
    return quizSession.userAnswers.map((a, i) => 
      `Q${i + 1}: ${a.question}\nUser answered: ${a.userAnswer}\nCorrect answer: ${a.correctAnswer}`
    ).join('\n---\n')
  }

  // Handle write another essay
  const handleWriteAnotherEssay = async () => {
    if (!user) return
    
    // Clear quiz session and reset writing session
    await clearQuizSession(user.uid)
    await resetSession(user.uid)
    
    router.push('/write')
  }
  
  // Handle module complete (no errors in essay)
  const handleModuleComplete = async () => {
    if (!user) return
    
    // Complete the lesson and advance
    await completeLesson(user.uid, currentLesson, 100)
    await clearQuizSession(user.uid)
    await resetSession(user.uid)
    
    router.push('/dashboard')
  }
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/dashboard')
  }
  
  // Trigger phase-dependent actions
  // Guard with isGenerating ref to prevent duplicate API calls
  useEffect(() => {
    // Skip if already generating to prevent race conditions
    if (isGenerating.current) return
    
    if (phase === 'generating_requirements' && quizSession && !quizSession.currentQuizRequirements) {
      isGenerating.current = true
      generateQuizRequirements()
    } else if (phase === 'generating_quiz' && quizSession?.currentQuizRequirements && !quizSession.currentQuiz) {
      isGenerating.current = true
      generateQuiz()
    } else if (phase === 'grading' && quizSession && !quizSession.quizResults) {
      isGenerating.current = true
      gradeQuiz()
    }
  }, [phase, quizSession, generateQuizRequirements, generateQuiz, gradeQuiz])
  
  // Loading state
  if (phase === 'loading') {
    return (
      <InteractiveLoader
        title="Loading quiz..."
        subtitle="Move your mouse to play with the orbs"
      />
    )
  }
  
  // Generating requirements
  if (phase === 'generating_requirements') {
    return (
      <InteractiveLoader
        title="Analyzing your essay..."
        subtitle="Determining what to quiz you on"
      />
    )
  }
  
  // Generating quiz
  if (phase === 'generating_quiz') {
    return (
      <InteractiveLoader
        title="Creating your quiz..."
        subtitle="Preparing personalized questions"
      />
    )
  }
  
  // Grading
  if (phase === 'grading') {
    return (
      <InteractiveLoader
        title="Grading your answers..."
        subtitle="Checking your responses"
      />
    )
  }
  
  // Generating teacher feedback
  if (phase === 'generating_feedback') {
    return (
      <InteractiveLoader
        title="Preparing your feedback..."
        subtitle="The AI teacher is reviewing your mistakes"
      />
    )
  }
  
  // Module complete
  if (phase === 'module_complete') {
    const techniques = GRADE_WRITING_TECHNIQUES[difficultyLevel]
    const currentTechnique = techniques[currentLesson] || 'Writing'
    const nextTechnique = techniques[currentLesson + 1]
    
    return (
      <ModuleComplete
        lessonName={currentTechnique}
        xpEarned={100}
        nextLessonName={nextTechnique}
      />
    )
  }
  
  // All topics done - show win screen
  if (phase === 'all_topics_done') {
    return (
      <WinScreen
        variant="quizzes_complete"
        xpEarned={100}
        learnedTopics={quizSession?.learnedTopics || []}
      />
    )
  }
  
  // Error state
  if (phase === 'error') {
    const handleRetry = () => {
      setError(null)
      // Just set the phase - let useEffect handle the API calls
      if (quizSession?.currentQuizRequirements && !quizSession?.currentQuiz) {
        setPhase('generating_quiz')
      } else if (!quizSession?.currentQuizRequirements) {
        setPhase('generating_requirements')
      } else {
        setPhase('answering')
      }
    }
    
    return (
      <div className={styles.quizPage}>
        <header className={styles.quizHeader}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeftIcon size={18} />
            Dashboard
          </button>
          <span className={styles.quizTitle}>Error</span>
          <div />
        </header>
        
        <main className={styles.quizContent}>
          <div className={styles.loadingContainer}>
            <p style={{ marginBottom: '1rem', color: '#dc2626' }}>{error || 'An error occurred'}</p>
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button className={styles.continueBtn} onClick={handleRetry}>
                Try Again
              </button>
              <button className={styles.backBtn} onClick={handleBack} style={{ padding: '0.75rem 1.5rem' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  // Quiz answering phase
  if (phase === 'answering' && quizSession?.currentQuiz) {
    const { currentQuiz, currentQuestionIndex } = quizSession
    const totalQuestions = currentQuiz.questions.length
    const currentQuestion = currentQuiz.questions[currentQuestionIndex]
    
    return (
      <div className={styles.quizPage}>
        <header className={styles.quizHeader}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeftIcon size={18} />
            Exit Quiz
          </button>
          <span className={styles.quizTitle}>{currentQuiz.name}</span>
          <div />
        </header>
        
        <main className={styles.quizContent}>
          <QuizProgress 
            current={currentQuestionIndex + 1}
            total={totalQuestions}
            quizName={currentQuiz.name}
          />
          
          <QuizQuestion
            questionNumber={currentQuestionIndex + 1}
            questionText={currentQuestion.question}
            questionType={quizSession.currentQuizRequirements?.questionType || 'A,B,C,D'}
            onAnswer={handleAnswerSubmit}
            disabled={isSubmitting}
          />
        </main>
      </div>
    )
  }
  
  // Show loading game for quiz grade self-review
  if (showQuizGradeLoadingGame) {
    return (
      <InteractiveLoader
        title="Verifying the grading..."
        subtitle="A second AI is reviewing your answers"
      />
    )
  }

  // Results phase
  if (phase === 'results' && quizSession?.quizResults) {
    const { quizResults } = quizSession
    
    return (
      <div className={styles.quizPage}>
        <header className={styles.quizHeader}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeftIcon size={18} />
            Dashboard
          </button>
          <span className={styles.quizTitle}>Quiz Results</span>
          <div />
        </header>
        
        <main className={styles.quizContent}>
          <QuizResults
            score={quizResults.score}
            passed={quizResults.passed}
            feedback={quizResults.feedback}
            onContinue={handleResultsContinue}
            continueLabel={quizResults.passed ? 'Continue' : 'Review Mistakes'}
            // Contest props
            formattedAnswers={getFormattedAnswersForContest()}
            onContestSuccess={handleQuizGradeContestSuccess}
            onContestConfirmed={handleQuizGradeContestConfirmed}
            contestConfirmed={quizGradeContestConfirmed}
            // User info for bug reports
            userId={user?.uid}
            userEmail={user?.email || undefined}
            displayName={user?.displayName}
            // Loading game props
            onShowLoadingGame={() => setShowQuizGradeLoadingGame(true)}
            onLoadingComplete={() => setShowQuizGradeLoadingGame(false)}
          />
        </main>
        
        {/* Teacher Chat - Available during results */}
        <TeacherChat context={teacherChatContext} difficultyLevel={difficultyLevel} />
      </div>
    )
  }
  
  // Feedback phase
  if (phase === 'feedback' && quizSession?.teacherFeedback) {
    const { teacherFeedback } = quizSession
    
    return (
      <div className={styles.quizPage}>
        <header className={styles.quizHeader}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeftIcon size={18} />
            Dashboard
          </button>
          <span className={styles.quizTitle}>Learning from Mistakes</span>
          <div />
        </header>
        
        <main className={styles.quizContent}>
          <FeedbackCard
            explanations={teacherFeedback.explanations}
            currentIndex={feedbackIndex}
            onNext={handleNextFeedback}
            onPrevious={handlePreviousFeedback}
            onFinish={handleFinishFeedback}
            onAskTeacher={() => teacherChatRef.current?.open()}
          />
        </main>
        
        {/* Teacher Chat - Available during feedback */}
        <TeacherChat ref={teacherChatRef} context={teacherChatContext} difficultyLevel={difficultyLevel} />
      </div>
    )
  }
  
  // Memory hooks phase
  if (phase === 'memory_hooks' && quizSession?.teacherFeedback) {
    const { teacherFeedback } = quizSession
    
    return (
      <div className={styles.quizPage}>
        <header className={styles.quizHeader}>
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeftIcon size={18} />
            Dashboard
          </button>
          <span className={styles.quizTitle}>Tips to Remember</span>
          <div />
        </header>
        
        <main className={styles.quizContent}>
          <MemoryHooks
            hooks={teacherFeedback.memoryHooks}
            onContinue={handleRetryQuiz}
          />
        </main>
        
        {/* Teacher Chat - Available during memory hooks */}
        <TeacherChat context={teacherChatContext} difficultyLevel={difficultyLevel} />
      </div>
    )
  }
  
  // Fallback loading
  return (
    <InteractiveLoader
      title="Loading..."
      subtitle="Please wait"
    />
  )
}

export default function QuizPage() {
  return (
    <ProtectedRoute requireSetup={true}>
      <QuizContent />
    </ProtectedRoute>
  )
}

