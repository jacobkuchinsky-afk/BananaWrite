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
  UserProfile,
  BugReport,
  BugReportStatus,
  BugReportContextType,
  BugReportMessage,
  UpdateNotification
} from '@/types'
import { addDoc } from 'firebase/firestore'

// Collection paths
const APP_SETTINGS_COLLECTION = 'appSettings'
const ANALYTICS_COLLECTION = 'analytics'
const USERS_COLLECTION = 'users'
const BUG_REPORTS_COLLECTION = 'bugReports'
const UPDATE_NOTIFICATIONS_COLLECTION = 'updateNotifications'

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

// ============================================
// Bug Reports Functions
// ============================================

/**
 * Save a new bug report
 */
export async function saveBugReport(report: {
  userId: string
  userEmail: string
  displayName: string | null
  contextType: BugReportContextType
  originalResponse: string
  userContent: string
  originalPrompt?: string
  selfReviewResult: {
    isCorrect: boolean
    correctionFeedback: string | null
    rawResponse: string
  }
}): Promise<string> {
  const bugReportsRef = collection(db, BUG_REPORTS_COLLECTION)
  
  // Firebase doesn't allow undefined values, so convert to null
  const docRef = await addDoc(bugReportsRef, {
    userId: report.userId,
    userEmail: report.userEmail,
    displayName: report.displayName,
    contextType: report.contextType,
    originalResponse: report.originalResponse,
    userContent: report.userContent,
    originalPrompt: report.originalPrompt ?? null,  // Convert undefined to null
    selfReviewResult: report.selfReviewResult,
    status: 'pending' as BugReportStatus,
    createdAt: serverTimestamp()
  })
  
  return docRef.id
}

/**
 * Get bug reports with optional status filter
 */
export async function getBugReports(statusFilter?: BugReportStatus): Promise<BugReport[]> {
  const bugReportsRef = collection(db, BUG_REPORTS_COLLECTION)
  
  let q
  if (statusFilter) {
    q = query(
      bugReportsRef, 
      where('status', '==', statusFilter),
      orderBy('createdAt', 'desc')
    )
  } else {
    q = query(bugReportsRef, orderBy('createdAt', 'desc'))
  }
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as BugReport))
}

/**
 * Get count of pending bug reports
 */
export async function getPendingBugReportsCount(): Promise<number> {
  const bugReportsRef = collection(db, BUG_REPORTS_COLLECTION)
  const q = query(bugReportsRef, where('status', '==', 'pending'))
  const snapshot = await getDocs(q)
  return snapshot.size
}

/**
 * Update bug report status
 */
export async function updateBugReportStatus(
  reportId: string,
  status: BugReportStatus,
  adminEmail: string,
  adminNotes?: string
): Promise<void> {
  const reportRef = doc(db, BUG_REPORTS_COLLECTION, reportId)
  
  const updateData: Record<string, unknown> = {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail
  }
  
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes
  }
  
  await updateDoc(reportRef, updateData)
}

/**
 * Create a general bug report (user-initiated from notification center)
 */
export async function createGeneralBugReport(report: {
  userId: string
  userEmail: string
  displayName: string | null
  message: string
}): Promise<string> {
  const bugReportsRef = collection(db, BUG_REPORTS_COLLECTION)
  
  const docRef = await addDoc(bugReportsRef, {
    userId: report.userId,
    userEmail: report.userEmail,
    displayName: report.displayName,
    contextType: 'general' as BugReportContextType,
    originalResponse: '',
    userContent: report.message,
    status: 'pending' as BugReportStatus,
    createdAt: serverTimestamp()
  })
  
  // Also add the initial message to the messages subcollection
  const messagesRef = collection(db, BUG_REPORTS_COLLECTION, docRef.id, 'messages')
  await addDoc(messagesRef, {
    senderId: report.userId,
    senderEmail: report.userEmail,
    senderName: report.displayName,
    isAdmin: false,
    content: report.message,
    createdAt: serverTimestamp()
  })
  
  return docRef.id
}

/**
 * Add a message to a bug report (chat functionality)
 */
export async function addMessageToBugReport(
  reportId: string,
  message: {
    senderId: string
    senderEmail: string
    senderName: string | null
    isAdmin: boolean
    content: string
  }
): Promise<string> {
  const messagesRef = collection(db, BUG_REPORTS_COLLECTION, reportId, 'messages')
  
  const docRef = await addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp()
  })
  
  return docRef.id
}

/**
 * Get all messages for a bug report
 */
export async function getBugReportMessages(reportId: string): Promise<BugReportMessage[]> {
  const messagesRef = collection(db, BUG_REPORTS_COLLECTION, reportId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as BugReportMessage))
}

/**
 * Get all bug reports for a specific user
 */
export async function getUserBugReports(userId: string): Promise<BugReport[]> {
  const bugReportsRef = collection(db, BUG_REPORTS_COLLECTION)
  const q = query(
    bugReportsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as BugReport))
}

/**
 * Get a single bug report by ID
 */
export async function getBugReportById(reportId: string): Promise<BugReport | null> {
  const reportRef = doc(db, BUG_REPORTS_COLLECTION, reportId)
  const reportSnap = await getDoc(reportRef)
  
  if (reportSnap.exists()) {
    return {
      id: reportSnap.id,
      ...reportSnap.data()
    } as BugReport
  }
  
  return null
}

// ============================================
// Update Notification Functions
// ============================================

/**
 * Create a new update notification (admin only)
 */
export async function createUpdateNotification(
  title: string,
  bulletPoints: string[],
  adminEmail: string
): Promise<string> {
  const notificationsRef = collection(db, UPDATE_NOTIFICATIONS_COLLECTION)
  
  const docRef = await addDoc(notificationsRef, {
    title,
    bulletPoints,
    createdAt: serverTimestamp(),
    createdBy: adminEmail
  })
  
  return docRef.id
}

/**
 * Get the latest update notification
 */
export async function getLatestUpdateNotification(): Promise<UpdateNotification | null> {
  const notificationsRef = collection(db, UPDATE_NOTIFICATIONS_COLLECTION)
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  } as UpdateNotification
}

/**
 * Get all update notifications (newest first)
 */
export async function getAllUpdateNotifications(): Promise<UpdateNotification[]> {
  const notificationsRef = collection(db, UPDATE_NOTIFICATIONS_COLLECTION)
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as UpdateNotification))
}
