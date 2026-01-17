/**
 * Admin Firestore helper functions for BananaWrite
 * Handles global app settings, analytics, and active session monitoring
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
import { 
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore'
import { 
  AppSettings, 
  DEFAULT_APP_SETTINGS,
  DailyAnalytics,
  ActiveSession,
  CurrentSession,
  QuizSession,
  UserProfile
} from '@/types'

// Collection paths
const APP_SETTINGS_COLLECTION = 'appSettings'
const ANALYTICS_COLLECTION = 'analytics'
const USERS_COLLECTION = 'users'

// Document references
const getAppSettingsDocRef = () => doc(db, APP_SETTINGS_COLLECTION, 'global')

// ============================================
// App Settings Functions
// ============================================

/**
 * Get global app settings
 * Returns defaults if settings don't exist yet
 */
export async function getAppSettings(): Promise<AppSettings> {
  const settingsRef = getAppSettingsDocRef()
  const settingsSnap = await getDoc(settingsRef)
  
  if (settingsSnap.exists()) {
    return settingsSnap.data() as AppSettings
  }
  
  // Return defaults if no settings exist
  return DEFAULT_APP_SETTINGS as AppSettings
}

/**
 * Update global app settings (admin only)
 */
export async function updateAppSettings(
  settings: Partial<Omit<AppSettings, 'updatedAt' | 'updatedBy'>>,
  adminEmail: string
): Promise<void> {
  const settingsRef = getAppSettingsDocRef()
  const currentSettings = await getAppSettings()
  
  await setDoc(settingsRef, {
    ...currentSettings,
    ...settings,
    updatedAt: serverTimestamp(),
    updatedBy: adminEmail
  })
}

/**
 * Initialize app settings with defaults (if they don't exist)
 */
export async function initializeAppSettings(adminEmail: string): Promise<void> {
  const settingsRef = getAppSettingsDocRef()
  const settingsSnap = await getDoc(settingsRef)
  
  if (!settingsSnap.exists()) {
    await setDoc(settingsRef, {
      ...DEFAULT_APP_SETTINGS,
      updatedAt: serverTimestamp(),
      updatedBy: adminEmail
    })
  }
}

// ============================================
// Analytics Functions
// ============================================

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get analytics for a specific date
 */
export async function getDailyAnalytics(date?: string): Promise<DailyAnalytics | null> {
  const dateStr = date || getTodayDateString()
  const analyticsRef = doc(db, ANALYTICS_COLLECTION, `daily_${dateStr}`)
  const analyticsSnap = await getDoc(analyticsRef)
  
  if (analyticsSnap.exists()) {
    return analyticsSnap.data() as DailyAnalytics
  }
  return null
}

/**
 * Get analytics for the past N days
 */
export async function getAnalyticsRange(days: number = 7): Promise<DailyAnalytics[]> {
  const analytics: DailyAnalytics[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const data = await getDailyAnalytics(dateStr)
    if (data) {
      analytics.push(data)
    }
  }
  
  return analytics
}

/**
 * Increment analytics counter (called when events happen)
 */
export async function incrementAnalytics(
  field: keyof Pick<DailyAnalytics, 'essaysSubmitted' | 'quizzesCompleted' | 'quizzesPassed'>,
  additionalData?: { errorType?: string; quizScore?: number }
): Promise<void> {
  const dateStr = getTodayDateString()
  const analyticsRef = doc(db, ANALYTICS_COLLECTION, `daily_${dateStr}`)
  const analyticsSnap = await getDoc(analyticsRef)
  
  let currentData: DailyAnalytics
  
  if (analyticsSnap.exists()) {
    currentData = analyticsSnap.data() as DailyAnalytics
  } else {
    currentData = {
      date: dateStr,
      totalUsers: 0,
      essaysSubmitted: 0,
      quizzesCompleted: 0,
      quizzesPassed: 0,
      averageQuizScore: 0,
      errorTypesBreakdown: {}
    }
  }
  
  // Increment the field
  currentData[field] = (currentData[field] || 0) + 1
  
  // Update error type breakdown if provided
  if (additionalData?.errorType) {
    currentData.errorTypesBreakdown[additionalData.errorType] = 
      (currentData.errorTypesBreakdown[additionalData.errorType] || 0) + 1
  }
  
  // Update average quiz score if provided
  if (additionalData?.quizScore !== undefined && field === 'quizzesCompleted') {
    const prevTotal = currentData.averageQuizScore * (currentData.quizzesCompleted - 1)
    currentData.averageQuizScore = (prevTotal + additionalData.quizScore) / currentData.quizzesCompleted
  }
  
  await setDoc(analyticsRef, currentData)
}

// ============================================
// Active Sessions Functions
// ============================================

/**
 * Get all active writing sessions
 */
export async function getActiveWritingSessions(): Promise<ActiveSession[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  
  const activeSessions: ActiveSession[] = []
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const userData = userDoc.data()
    
    // Get user's session
    const sessionRef = doc(db, USERS_COLLECTION, userId, 'data', 'session')
    const sessionSnap = await getDoc(sessionRef)
    
    if (sessionSnap.exists()) {
      const session = sessionSnap.data() as CurrentSession
      
      if (session.status === 'writing') {
        // Get profile for display name
        const profileRef = doc(db, USERS_COLLECTION, userId, 'data', 'profile')
        const profileSnap = await getDoc(profileRef)
        const profile = profileSnap.exists() ? profileSnap.data() as UserProfile : null
        
        activeSessions.push({
          oderId: userId,
          userEmail: userData.email || profile?.email || 'Unknown',
          displayName: profile?.displayName || null,
          sessionType: 'essay',
          status: session.status,
          startedAt: session.startedAt,
          writingTechnique: session.writingTechnique,
          wordCount: session.wordCount
        })
      }
    }
  }
  
  return activeSessions
}

/**
 * Get all active quiz sessions
 */
export async function getActiveQuizSessions(): Promise<ActiveSession[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  
  const activeSessions: ActiveSession[] = []
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const userData = userDoc.data()
    
    // Get user's quiz session
    const quizRef = doc(db, USERS_COLLECTION, userId, 'data', 'quizSession')
    const quizSnap = await getDoc(quizRef)
    
    if (quizSnap.exists()) {
      const quizSession = quizSnap.data() as QuizSession
      
      if (quizSession.status !== 'complete' && quizSession.essayErrors.length > 0) {
        // Get profile for display name
        const profileRef = doc(db, USERS_COLLECTION, userId, 'data', 'profile')
        const profileSnap = await getDoc(profileRef)
        const profile = profileSnap.exists() ? profileSnap.data() as UserProfile : null
        
        const totalQuestions = quizSession.currentQuiz?.questions.length || 0
        const currentQuestion = quizSession.currentQuestionIndex + 1
        
        activeSessions.push({
          oderId: userId,
          userEmail: userData.email || profile?.email || 'Unknown',
          displayName: profile?.displayName || null,
          sessionType: 'quiz',
          status: quizSession.status,
          startedAt: quizSession.startedAt,
          quizTopic: quizSession.currentQuizRequirements?.topic,
          quizProgress: totalQuestions > 0 ? `${currentQuestion}/${totalQuestions}` : undefined
        })
      }
    }
  }
  
  return activeSessions
}

/**
 * Get all active sessions (essays + quizzes)
 */
export async function getAllActiveSessions(): Promise<ActiveSession[]> {
  const [essays, quizzes] = await Promise.all([
    getActiveWritingSessions(),
    getActiveQuizSessions()
  ])
  
  return [...essays, ...quizzes].sort((a, b) => {
    const aTime = a.startedAt?.toMillis() || 0
    const bTime = b.startedAt?.toMillis() || 0
    return bTime - aTime // Most recent first
  })
}

/**
 * Get total user count
 */
export async function getTotalUserCount(): Promise<number> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  return usersSnap.size
}

/**
 * Get aggregate stats for dashboard
 */
export async function getAdminDashboardStats(): Promise<{
  totalUsers: number
  activeEssays: number
  activeQuizzes: number
  todayEssays: number
  todayQuizzes: number
  todayPassRate: number
}> {
  const [totalUsers, activeEssays, activeQuizzes, todayAnalytics] = await Promise.all([
    getTotalUserCount(),
    getActiveWritingSessions(),
    getActiveQuizSessions(),
    getDailyAnalytics()
  ])
  
  const todayPassRate = todayAnalytics && todayAnalytics.quizzesCompleted > 0
    ? Math.round((todayAnalytics.quizzesPassed / todayAnalytics.quizzesCompleted) * 100)
    : 0
  
  return {
    totalUsers,
    activeEssays: activeEssays.length,
    activeQuizzes: activeQuizzes.length,
    todayEssays: todayAnalytics?.essaysSubmitted || 0,
    todayQuizzes: todayAnalytics?.quizzesCompleted || 0,
    todayPassRate
  }
}
