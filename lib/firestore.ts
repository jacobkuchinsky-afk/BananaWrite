/**
 * Firestore helper functions for BananaWrite
 * Handles all database operations for user data, progress, and sessions
 */

import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from './firebase'
import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore'
import { 
  UserProfile, 
  UserProgress, 
  CurrentSession, 
  DEFAULT_USER_PROGRESS, 
  DEFAULT_CURRENT_SESSION,
  SessionStatus,
  QuizSession,
  QuizSessionStatus,
  DEFAULT_QUIZ_SESSION,
  QuizRequirements,
  QuizQuestion,
  QuizAnswer,
  QuizGradingResult,
  TeacherFeedback,
  UserSettings,
  DEFAULT_USER_SETTINGS,
  CrazinessLevel,
  FocusTopic,
  EssayType,
  Theme
} from '@/types'
import { getDifficultyPresetForEmail } from '@/lib/adminFirestore'

// Collection paths
const USERS_COLLECTION = 'users'

// Helper to get document references
const getUserDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId)
const getProgressDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId, 'data', 'progress')
const getSessionDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId, 'data', 'session')
const getProfileDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId, 'data', 'profile')
const getQuizSessionDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId, 'data', 'quizSession')
const getSettingsDocRef = (userId: string) => doc(db, USERS_COLLECTION, userId, 'data', 'settings')

/**
 * Initialize a new user in Firestore
 * Called when a user signs up or signs in for the first time
 */
export async function initializeUser(userId: string, email: string, displayName: string | null): Promise<void> {
  const userDocRef = getUserDocRef(userId)
  const profileRef = getProfileDocRef(userId)
  const progressRef = getProgressDocRef(userId)
  const sessionRef = getSessionDocRef(userId)
  const settingsRef = getSettingsDocRef(userId)

  // Check if user already exists
  const [profileSnap, settingsSnap] = await Promise.all([
    getDoc(profileRef),
    getDoc(settingsRef)
  ])
  
  if (!profileSnap.exists()) {
    // Create parent user document first (required for subcollections)
    await setDoc(userDocRef, {
      createdAt: serverTimestamp(),
      email: email
    })

    // Create profile
    const profile: UserProfile = {
      email,
      displayName,
      createdAt: serverTimestamp() as Timestamp,
      lastActive: serverTimestamp() as Timestamp
    }
    await setDoc(profileRef, profile)

    // Create progress
    await setDoc(progressRef, DEFAULT_USER_PROGRESS)

    // Create session
    await setDoc(sessionRef, DEFAULT_CURRENT_SESSION)

    if (!settingsSnap.exists()) {
      let difficultyLevel = DEFAULT_USER_SETTINGS.difficultyLevel
      try {
        const preset = await getDifficultyPresetForEmail(email)
        if (preset) difficultyLevel = preset
      } catch (e) {
        console.warn('Could not check difficulty preset:', e)
      }
      await setDoc(settingsRef, { ...DEFAULT_USER_SETTINGS, difficultyLevel })
    }
    
    console.log('New user documents created successfully')
  } else {
    // Update last active
    await updateDoc(profileRef, {
      lastActive: serverTimestamp()
    })
  }
}

/**
 * Get user's current progress
 */
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const progressRef = getProgressDocRef(userId)
  const progressSnap = await getDoc(progressRef)
  
  if (progressSnap.exists()) {
    return progressSnap.data() as UserProgress
  }
  return null
}

/**
 * Get user's current session
 */
export async function getCurrentSession(userId: string): Promise<CurrentSession | null> {
  const sessionRef = getSessionDocRef(userId)
  const sessionSnap = await getDoc(sessionRef)
  
  if (sessionSnap.exists()) {
    return sessionSnap.data() as CurrentSession
  }
  return null
}

/**
 * Start a new writing session
 * Updates the session status and stores the essay prompt
 */
export async function startWritingSession(
  userId: string, 
  writingTechnique: string, 
  essayPrompt: string
): Promise<void> {
  const sessionRef = getSessionDocRef(userId)
  
  await updateDoc(sessionRef, {
    status: 'writing' as SessionStatus,
    writingTechnique,
    essayPrompt,
    essayDraft: '',
    wordCount: 0,
    activeMinutes: 0,
    startedAt: serverTimestamp(),
    lastSavedAt: serverTimestamp(),
    submittedAt: null
  })
}

/**
 * Save essay draft (auto-save or manual save)
 */
export async function saveEssayDraft(
  userId: string, 
  essayDraft: string, 
  wordCount: number
): Promise<void> {
  const sessionRef = getSessionDocRef(userId)
  
  await updateDoc(sessionRef, {
    essayDraft,
    wordCount,
    lastSavedAt: serverTimestamp()
  })
}

/**
 * Submit the essay
 * Marks the session as submitted and records activity time for XP
 */
export async function submitEssay(userId: string, activeMinutes?: number): Promise<void> {
  const sessionRef = getSessionDocRef(userId)
  
  await updateDoc(sessionRef, {
    status: 'submitted' as SessionStatus,
    submittedAt: serverTimestamp(),
    ...(activeMinutes !== undefined && { activeMinutes })
  })
}

/**
 * Reset session to idle (after completing a lesson or starting fresh)
 */
export async function resetSession(userId: string): Promise<void> {
  const sessionRef = getSessionDocRef(userId)
  
  await setDoc(sessionRef, DEFAULT_CURRENT_SESSION)
}

/**
 * Update current lesson index
 */
export async function updateCurrentLesson(userId: string, lessonIndex: number): Promise<void> {
  const progressRef = getProgressDocRef(userId)
  
  await updateDoc(progressRef, {
    currentLesson: lessonIndex
  })
}

/**
 * Mark a lesson as completed and increment XP.
 * Also logs the XP award to the xpHistory subcollection for stats tracking.
 */
export async function completeLesson(userId: string, lessonIndex: number, xpEarned: number): Promise<void> {
  const progressRef = getProgressDocRef(userId)
  const progress = await getUserProgress(userId)
  
  if (progress) {
    const completedLessons = progress.completedLessons.includes(lessonIndex)
      ? progress.completedLessons
      : [...progress.completedLessons, lessonIndex]
    
    await updateDoc(progressRef, {
      completedLessons,
      totalXP: progress.totalXP + xpEarned,
      currentLesson: lessonIndex + 1
    })

    const historyRef = collection(db, USERS_COLLECTION, userId, 'xpHistory')
    addDoc(historyRef, {
      amount: xpEarned,
      lessonIndex,
      timestamp: serverTimestamp()
    }).catch(err => console.error('Failed to log XP history:', err))
  }
}

/**
 * Get a user's XP history entries, ordered by time (oldest first).
 */
export async function getXPHistory(userId: string): Promise<Array<{ amount: number; timestamp: Timestamp }>> {
  const historyRef = collection(db, USERS_COLLECTION, userId, 'xpHistory')
  const q = query(historyRef, orderBy('timestamp', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as { amount: number; timestamp: Timestamp })
}

/**
 * Get full user data (profile, progress, and session)
 */
export async function getFullUserData(userId: string): Promise<{
  profile: UserProfile | null
  progress: UserProgress | null
  session: CurrentSession | null
}> {
  const [profileSnap, progressSnap, sessionSnap] = await Promise.all([
    getDoc(getProfileDocRef(userId)),
    getDoc(getProgressDocRef(userId)),
    getDoc(getSessionDocRef(userId))
  ])

  return {
    profile: profileSnap.exists() ? profileSnap.data() as UserProfile : null,
    progress: progressSnap.exists() ? progressSnap.data() as UserProgress : null,
    session: sessionSnap.exists() ? sessionSnap.data() as CurrentSession : null
  }
}

// ============================================
// Quiz Session Functions
// ============================================

/**
 * Get user's current quiz session
 */
export async function getQuizSession(userId: string): Promise<QuizSession | null> {
  const quizRef = getQuizSessionDocRef(userId)
  const quizSnap = await getDoc(quizRef)
  
  if (quizSnap.exists()) {
    return quizSnap.data() as QuizSession
  }
  return null
}

/**
 * Start a new quiz session after essay review
 */
export async function startQuizSession(
  userId: string,
  essayText: string,
  essayErrors: string[],
  rawErrorsResponse: string
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await setDoc(quizRef, {
    ...DEFAULT_QUIZ_SESSION,
    status: 'reviewing' as QuizSessionStatus,
    essayText,
    essayErrors,
    rawErrorsResponse,
    startedAt: serverTimestamp()
  })
}

/**
 * Update quiz requirements after AI decides what to quiz on
 */
export async function setQuizRequirements(
  userId: string,
  requirements: QuizRequirements
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await updateDoc(quizRef, {
    currentQuizRequirements: requirements,
    status: 'quizzing' as QuizSessionStatus
  })
}

/**
 * Set the current quiz questions
 */
export async function setCurrentQuiz(
  userId: string,
  quizName: string,
  questions: QuizQuestion[]
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await updateDoc(quizRef, {
    currentQuiz: {
      name: quizName,
      questions
    },
    currentQuestionIndex: 0,
    userAnswers: [],
    status: 'quizzing' as QuizSessionStatus
  })
}

/**
 * Replace a single question in the current quiz (used when a question is reported)
 */
export async function replaceQuizQuestion(
  userId: string,
  questionIndex: number,
  newQuestion: QuizQuestion
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  const session = await getQuizSession(userId)
  if (!session?.currentQuiz) return

  const updatedQuestions = [...session.currentQuiz.questions]
  updatedQuestions[questionIndex] = newQuestion

  await updateDoc(quizRef, {
    'currentQuiz.questions': updatedQuestions
  })
}

/**
 * Submit an answer for the current question
 */
export async function submitQuizAnswer(
  userId: string,
  answer: QuizAnswer
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  const quizSession = await getQuizSession(userId)
  
  if (quizSession) {
    const newAnswers = [...quizSession.userAnswers, answer]
    const newIndex = quizSession.currentQuestionIndex + 1
    
    await updateDoc(quizRef, {
      userAnswers: newAnswers,
      currentQuestionIndex: newIndex
    })
  }
}

/**
 * Save a snapshot to quizHistory subcollection for teacher progress tracking
 */
export async function saveQuizHistoryEntry(
  userId: string,
  quizSession: QuizSession,
  results: QuizGradingResult,
  lessonNumber: number,
  writingTechnique: string
): Promise<void> {
  const historyRef = collection(db, USERS_COLLECTION, userId, 'quizHistory')
  await addDoc(historyRef, {
    timestamp: serverTimestamp(),
    lessonNumber,
    writingTechnique,
    essayErrors: quizSession.essayErrors,
    quizTopic: quizSession.currentQuizRequirements?.topic || '',
    questionType: quizSession.currentQuizRequirements?.questionType || '',
    questionCount: quizSession.currentQuiz?.questions.length || 0,
    score: results.score,
    passed: results.passed,
    userAnswers: quizSession.userAnswers,
    teacherFeedback: quizSession.teacherFeedback
      ? { explanations: quizSession.teacherFeedback.explanations, memoryHooks: quizSession.teacherFeedback.memoryHooks }
      : null
  })
}

/**
 * Save quiz grading results
 */
export async function saveQuizResults(
  userId: string,
  results: QuizGradingResult
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await updateDoc(quizRef, {
    quizResults: results,
    status: results.passed ? 'complete' : 'grading',
    lastQuizResults: results.feedback
  })
}

/**
 * Save teacher feedback
 */
export async function saveTeacherFeedback(
  userId: string,
  feedback: TeacherFeedback
): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await updateDoc(quizRef, {
    teacherFeedback: feedback,
    currentFeedbackIndex: 0,
    status: 'feedback' as QuizSessionStatus
  })
}

/**
 * Advance to next feedback item
 */
export async function advanceFeedbackIndex(userId: string): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  const quizSession = await getQuizSession(userId)
  
  if (quizSession) {
    await updateDoc(quizRef, {
      currentFeedbackIndex: quizSession.currentFeedbackIndex + 1
    })
  }
}

/**
 * Mark a topic as learned (passed quiz) and accumulate question count for XP
 */
export async function markTopicLearned(userId: string, topic: string, questionsInQuiz: number = 0): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  const quizSession = await getQuizSession(userId)
  
  if (quizSession) {
    const newLearnedTopics = quizSession.learnedTopics.includes(topic)
      ? quizSession.learnedTopics
      : [...quizSession.learnedTopics, topic]
    
    await updateDoc(quizRef, {
      learnedTopics: newLearnedTopics,
      totalQuestionsAnswered: (quizSession.totalQuestionsAnswered || 0) + questionsInQuiz
    })
  }
}

/**
 * Reset quiz for retry (failed quiz, try again)
 */
export async function resetQuizForRetry(userId: string): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  const quizSession = await getQuizSession(userId)
  
  if (quizSession) {
    await updateDoc(quizRef, {
      currentQuiz: null,
      currentQuestionIndex: 0,
      userAnswers: [],
      quizResults: null,
      teacherFeedback: null,
      currentFeedbackIndex: 0,
      status: 'reviewing' as QuizSessionStatus
    })
  }
}

/**
 * Complete quiz session (all topics learned, ready for new essay)
 */
export async function completeQuizSession(userId: string, activeMinutes?: number): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await updateDoc(quizRef, {
    status: 'complete' as QuizSessionStatus,
    completedAt: serverTimestamp(),
    ...(activeMinutes !== undefined && { activeMinutes })
  })
}

/**
 * Clear quiz session entirely (after module completion or starting fresh)
 */
export async function clearQuizSession(userId: string): Promise<void> {
  const quizRef = getQuizSessionDocRef(userId)
  
  await setDoc(quizRef, DEFAULT_QUIZ_SESSION)
}

/**
 * Get full user data including quiz session
 */
export async function getFullUserDataWithQuiz(userId: string): Promise<{
  profile: UserProfile | null
  progress: UserProgress | null
  session: CurrentSession | null
  quizSession: QuizSession | null
}> {
  const [profileSnap, progressSnap, sessionSnap, quizSnap] = await Promise.all([
    getDoc(getProfileDocRef(userId)),
    getDoc(getProgressDocRef(userId)),
    getDoc(getSessionDocRef(userId)),
    getDoc(getQuizSessionDocRef(userId))
  ])

  return {
    profile: profileSnap.exists() ? profileSnap.data() as UserProfile : null,
    progress: progressSnap.exists() ? progressSnap.data() as UserProgress : null,
    session: sessionSnap.exists() ? sessionSnap.data() as CurrentSession : null,
    quizSession: quizSnap.exists() ? quizSnap.data() as QuizSession : null
  }
}

// ============================================
// User Settings Functions (Craziness & Focus)
// ============================================

/**
 * Get user's settings (craziness, focus, setupComplete)
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const settingsRef = getSettingsDocRef(userId)
  const settingsSnap = await getDoc(settingsRef)
  
  if (settingsSnap.exists()) {
    return settingsSnap.data() as UserSettings
  }
  return null
}

/**
 * Update user's craziness, focus, and essay type settings
 */
export async function updateUserSettings(
  userId: string,
  craziness: CrazinessLevel,
  focus: FocusTopic,
  essayType: EssayType
): Promise<void> {
  const settingsRef = getSettingsDocRef(userId)
  
  await updateDoc(settingsRef, {
    craziness,
    focus,
    essayType,
    setupComplete: true
  })
}

/**
 * Mark user setup as complete
 */
export async function completeUserSetup(
  userId: string,
  craziness: CrazinessLevel,
  focus: FocusTopic,
  essayType: EssayType
): Promise<void> {
  const settingsRef = getSettingsDocRef(userId)
  
  await setDoc(settingsRef, {
    craziness,
    focus,
    essayType,
    setupComplete: true
  })
}

/**
 * Update user's theme preference
 */
export async function updateUserTheme(userId: string, theme: Theme): Promise<void> {
  const settingsRef = getSettingsDocRef(userId)
  await setDoc(settingsRef, { theme }, { merge: true })
}

/**
 * Check if user has completed setup
 */
export async function isSetupComplete(userId: string): Promise<boolean> {
  const settings = await getUserSettings(userId)
  return settings?.setupComplete ?? false
}

/**
 * Get full user data including settings
 */
export async function getFullUserDataWithSettings(userId: string): Promise<{
  profile: UserProfile | null
  progress: UserProgress | null
  session: CurrentSession | null
  quizSession: QuizSession | null
  settings: UserSettings | null
}> {
  const [profileSnap, progressSnap, sessionSnap, quizSnap, settingsSnap] = await Promise.all([
    getDoc(getProfileDocRef(userId)),
    getDoc(getProgressDocRef(userId)),
    getDoc(getSessionDocRef(userId)),
    getDoc(getQuizSessionDocRef(userId)),
    getDoc(getSettingsDocRef(userId))
  ])

  return {
    profile: profileSnap.exists() ? profileSnap.data() as UserProfile : null,
    progress: progressSnap.exists() ? progressSnap.data() as UserProgress : null,
    session: sessionSnap.exists() ? sessionSnap.data() as CurrentSession : null,
    quizSession: quizSnap.exists() ? quizSnap.data() as QuizSession : null,
    settings: settingsSnap.exists() ? settingsSnap.data() as UserSettings : null
  }
}

// ============================================
// Update Notification Dismissal Functions
// ============================================

/**
 * Dismiss an update notification for a user
 * Stores the notification ID so it won't show again
 */
export async function dismissUpdateNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const settingsRef = getSettingsDocRef(userId)
  
  await setDoc(settingsRef, {
    dismissedNotificationId: notificationId
  }, { merge: true })
}

/**
 * Get the ID of the notification the user has dismissed
 */
export async function getUserDismissedNotificationId(userId: string): Promise<string | null> {
  const settings = await getUserSettings(userId)
  return settings?.dismissedNotificationId ?? null
}
