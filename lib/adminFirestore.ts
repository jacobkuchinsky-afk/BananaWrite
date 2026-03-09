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
  UserProgress,
  UserSettings,
  BugReport,
  BugReportStatus,
  BugReportContextType,
  BugReportMessage,
  UpdateNotification,
  DifficultyLevel,
  DifficultyPreset,
  QuizHistoryEntry,
  Classroom,
  SUPER_ADMIN_EMAIL
} from '@/types'
import { addDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

// Collection paths
const APP_SETTINGS_COLLECTION = 'appSettings'
const ANALYTICS_COLLECTION = 'analytics'
const USERS_COLLECTION = 'users'
const BUG_REPORTS_COLLECTION = 'bugReports'
const UPDATE_NOTIFICATIONS_COLLECTION = 'updateNotifications'
const DIFFICULTY_PRESETS_COLLECTION = 'difficultyPresets'
const CLASSROOMS_COLLECTION = 'classrooms'

// Document references
const getAppSettingsDocRef = () => doc(db, APP_SETTINGS_COLLECTION, 'global')
const getAdminListDocRef = () => doc(db, APP_SETTINGS_COLLECTION, 'admins')
const getTeacherListDocRef = () => doc(db, APP_SETTINGS_COLLECTION, 'teachers')

// ============================================
// Admin List Functions
// ============================================

/**
 * Get list of admin emails from Firestore.
 * Always includes the super admin.
 */
export async function getAdminEmails(): Promise<string[]> {
  const adminsRef = getAdminListDocRef()
  const adminsSnap = await getDoc(adminsRef)
  
  const superAdmin = SUPER_ADMIN_EMAIL.toLowerCase()
  
  if (adminsSnap.exists()) {
    const data = adminsSnap.data()
    const emails: string[] = (data.emails || []).map((e: string) => e.toLowerCase())
    if (!emails.includes(superAdmin)) {
      emails.unshift(superAdmin)
    }
    return emails
  }
  
  return [superAdmin]
}

/**
 * Check if an email is an admin
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
  const admins = await getAdminEmails()
  return admins.includes(email.toLowerCase())
}

/**
 * Add an email to the admin list
 */
export async function addAdmin(email: string): Promise<void> {
  const adminsRef = getAdminListDocRef()
  const adminsSnap = await getDoc(adminsRef)
  
  if (!adminsSnap.exists()) {
    await setDoc(adminsRef, {
      emails: [SUPER_ADMIN_EMAIL.toLowerCase(), email.toLowerCase()]
    })
  } else {
    await updateDoc(adminsRef, {
      emails: arrayUnion(email.toLowerCase())
    })
  }
}

/**
 * Remove an email from the admin list. Cannot remove super admin.
 */
export async function removeAdmin(email: string): Promise<void> {
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Cannot remove the super admin')
  }
  const adminsRef = getAdminListDocRef()
  const adminsSnap = await getDoc(adminsRef)
  if (!adminsSnap.exists()) {
    throw new Error('Admin list does not exist')
  }
  await updateDoc(adminsRef, {
    emails: arrayRemove(email.toLowerCase())
  })
}

/**
 * Initialize the admin list if it doesn't exist
 */
export async function initializeAdminList(): Promise<void> {
  const adminsRef = getAdminListDocRef()
  const adminsSnap = await getDoc(adminsRef)
  
  if (!adminsSnap.exists()) {
    await setDoc(adminsRef, {
      emails: [SUPER_ADMIN_EMAIL.toLowerCase()]
    })
  }
}

// ============================================
// Teacher List Functions
// ============================================

export async function getTeacherEmails(): Promise<string[]> {
  const teachersRef = getTeacherListDocRef()
  const teachersSnap = await getDoc(teachersRef)
  if (teachersSnap.exists()) {
    return (teachersSnap.data().emails || []).map((e: string) => e.toLowerCase())
  }
  return []
}

export async function checkIsTeacher(email: string): Promise<boolean> {
  const teachers = await getTeacherEmails()
  return teachers.includes(email.toLowerCase())
}

export async function addTeacher(email: string): Promise<void> {
  const teachersRef = getTeacherListDocRef()
  const teachersSnap = await getDoc(teachersRef)
  if (!teachersSnap.exists()) {
    await setDoc(teachersRef, { emails: [email.toLowerCase()] })
  } else {
    await updateDoc(teachersRef, { emails: arrayUnion(email.toLowerCase()) })
  }
}

export async function removeTeacher(email: string): Promise<void> {
  const teachersRef = getTeacherListDocRef()
  await updateDoc(teachersRef, { emails: arrayRemove(email.toLowerCase()) })
}

// ============================================
// Classroom Functions
// ============================================

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createClassroom(name: string, teacherEmail: string): Promise<string> {
  const classroomsRef = collection(db, CLASSROOMS_COLLECTION)
  const classCode = generateClassCode()
  const docRef = await addDoc(classroomsRef, {
    name,
    teacherEmail: teacherEmail.toLowerCase(),
    classCode,
    studentEmails: [],
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function getTeacherClassrooms(teacherEmail: string): Promise<Classroom[]> {
  const classroomsRef = collection(db, CLASSROOMS_COLLECTION)
  const q = query(classroomsRef, where('teacherEmail', '==', teacherEmail.toLowerCase()), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom))
}

export async function getClassroomById(classroomId: string): Promise<Classroom | null> {
  const classroomRef = doc(db, CLASSROOMS_COLLECTION, classroomId)
  const snap = await getDoc(classroomRef)
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Classroom
  }
  return null
}

export async function joinClassroom(classCode: string, studentEmail: string): Promise<string | null> {
  const classroomsRef = collection(db, CLASSROOMS_COLLECTION)
  const q = query(classroomsRef, where('classCode', '==', classCode.toUpperCase()))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const classroomDoc = snapshot.docs[0]
  await updateDoc(doc(db, CLASSROOMS_COLLECTION, classroomDoc.id), {
    studentEmails: arrayUnion(studentEmail.toLowerCase())
  })
  return classroomDoc.id
}

export async function removeStudentFromClassroom(classroomId: string, studentEmail: string): Promise<void> {
  const classroomRef = doc(db, CLASSROOMS_COLLECTION, classroomId)
  await updateDoc(classroomRef, {
    studentEmails: arrayRemove(studentEmail.toLowerCase())
  })
}

export async function deleteClassroom(classroomId: string): Promise<void> {
  const classroomRef = doc(db, CLASSROOMS_COLLECTION, classroomId)
  await deleteDoc(classroomRef)
}

// ============================================
// Student Data Functions (for teacher views)
// ============================================

export interface StudentOverview {
  userId: string
  email: string
  displayName: string | null
  currentLesson: number
  completedLessons: number[]
  totalXP: number
  difficultyLevel: DifficultyLevel
  sessionStatus: string
  lastActive: Timestamp | null
}

export async function getClassroomStudents(classroomId: string): Promise<StudentOverview[]> {
  const classroom = await getClassroomById(classroomId)
  if (!classroom) return []

  const students: StudentOverview[] = []
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const userData = userDoc.data()
    const email = (userData.email || '').toLowerCase()
    if (!classroom.studentEmails.includes(email)) continue

    const [profileSnap, progressSnap, settingsSnap, sessionSnap] = await Promise.all([
      getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'profile')),
      getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'progress')),
      getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'settings')),
      getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'session'))
    ])

    const profile = profileSnap.exists() ? profileSnap.data() as UserProfile : null
    const progress = progressSnap.exists() ? progressSnap.data() as UserProgress : null
    const settings = settingsSnap.exists() ? settingsSnap.data() as UserSettings : null
    const session = sessionSnap.exists() ? sessionSnap.data() as CurrentSession : null

    students.push({
      userId,
      email: profile?.email || email,
      displayName: profile?.displayName || null,
      currentLesson: progress?.currentLesson ?? 0,
      completedLessons: progress?.completedLessons ?? [],
      totalXP: progress?.totalXP ?? 0,
      difficultyLevel: settings?.difficultyLevel || 'proficient',
      sessionStatus: session?.status || 'idle',
      lastActive: profile?.lastActive || null
    })
  }

  return students.sort((a, b) => a.email.localeCompare(b.email))
}

export async function getStudentQuizHistory(userId: string): Promise<QuizHistoryEntry[]> {
  const historyRef = collection(db, USERS_COLLECTION, userId, 'quizHistory')
  const q = query(historyRef, orderBy('timestamp', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuizHistoryEntry))
}

export async function getStudentFullProfile(userId: string): Promise<{
  profile: UserProfile | null
  progress: UserProgress | null
  settings: UserSettings | null
  sessionStatus: string
}> {
  const [profileSnap, progressSnap, settingsSnap, sessionSnap] = await Promise.all([
    getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'profile')),
    getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'progress')),
    getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'settings')),
    getDoc(doc(db, USERS_COLLECTION, userId, 'data', 'session'))
  ])

  const session = sessionSnap.exists() ? sessionSnap.data() as CurrentSession : null
  return {
    profile: profileSnap.exists() ? profileSnap.data() as UserProfile : null,
    progress: progressSnap.exists() ? progressSnap.data() as UserProgress : null,
    settings: settingsSnap.exists() ? settingsSnap.data() as UserSettings : null,
    sessionStatus: session?.status || 'idle'
  }
}

export function parseErrorCategory(errorStr: string): string {
  const withoutSeverity = errorStr.split('~')[0].trim()
  return withoutSeverity.replace(/\s*\(\d+\s*instances?\)/i, '').trim()
}

export interface StruggleArea {
  category: string
  occurrences: number
  scores: { date: Date; score: number; passed: boolean }[]
  latestScore: number
  trend: 'improving' | 'declining' | 'stable'
  mastered: boolean
}

export function computeStruggleAreas(history: QuizHistoryEntry[], passingScore: number = 75): StruggleArea[] {
  const categoryMap: Record<string, StruggleArea> = {}

  const sorted = [...history].sort((a, b) => {
    const aTime = a.timestamp?.toDate?.() ? a.timestamp.toDate().getTime() : 0
    const bTime = b.timestamp?.toDate?.() ? b.timestamp.toDate().getTime() : 0
    return aTime - bTime
  })

  for (const entry of sorted) {
    const topicCategory = parseErrorCategory(entry.quizTopic)
    if (!topicCategory) continue

    if (!categoryMap[topicCategory]) {
      categoryMap[topicCategory] = {
        category: topicCategory,
        occurrences: 0,
        scores: [],
        latestScore: 0,
        trend: 'stable',
        mastered: false
      }
    }

    categoryMap[topicCategory].occurrences++
    const date = entry.timestamp?.toDate?.() ? entry.timestamp.toDate() : new Date()
    categoryMap[topicCategory].scores.push({ date, score: entry.score, passed: entry.passed })
    categoryMap[topicCategory].latestScore = entry.score
  }

  for (const area of Object.values(categoryMap)) {
    const scores = area.scores
    if (scores.length >= 2) {
      const recent = scores.slice(-3)
      const avgRecent = recent.reduce((s, e) => s + e.score, 0) / recent.length
      const earlier = scores.slice(0, -3).length > 0 ? scores.slice(0, -3) : scores.slice(0, 1)
      const avgEarlier = earlier.reduce((s, e) => s + e.score, 0) / earlier.length
      const diff = avgRecent - avgEarlier
      area.trend = diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable'
    }
    const lastTwo = scores.slice(-2)
    area.mastered = lastTwo.length >= 2 && lastTwo.every(s => s.passed)
  }

  return Object.values(categoryMap).sort((a, b) => {
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1
    return b.occurrences - a.occurrences
  })
}

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
  additionalData?: { errorTypes?: string[]; quizScore?: number }
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
  if (additionalData?.errorTypes) {
    for (const errorType of additionalData.errorTypes) {
      currentData.errorTypesBreakdown[errorType] = 
        (currentData.errorTypesBreakdown[errorType] || 0) + 1
    }
  }
  
  // Update average quiz score if provided
  if (additionalData?.quizScore !== undefined && field === 'quizzesCompleted') {
    const prevTotal = currentData.averageQuizScore * (currentData.quizzesCompleted - 1)
    currentData.averageQuizScore = (prevTotal + additionalData.quizScore) / currentData.quizzesCompleted
  }

  // Snapshot the current total user count
  try {
    const userCount = await getTotalUserCount()
    currentData.totalUsers = userCount
  } catch {
    // Non-critical, skip if it fails
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
          orderId: userId,
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
          orderId: userId,
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
 * Get lesson progress distribution across all users.
 * Returns a map of lessonIndex -> number of users at that lesson.
 */
export async function getLessonProgressDistribution(): Promise<Record<number, number>> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  
  const distribution: Record<number, number> = {}
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const progressRef = doc(db, USERS_COLLECTION, userId, 'data', 'progress')
    const progressSnap = await getDoc(progressRef)
    
    if (progressSnap.exists()) {
      const progress = progressSnap.data()
      const lesson = progress.currentLesson ?? 0
      distribution[lesson] = (distribution[lesson] || 0) + 1
    }
  }
  
  return distribution
}

/**
 * Get user signup counts per day for the past N days.
 * Queries user profiles and groups by createdAt date.
 */
export async function getUserGrowthData(days: number = 14): Promise<{ date: string; newUsers: number; cumulativeUsers: number }[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  
  const signupsByDate: Record<string, number> = {}
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const profileRef = doc(db, USERS_COLLECTION, userId, 'data', 'profile')
    const profileSnap = await getDoc(profileRef)
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile
      if (profile.createdAt) {
        const createdDate = profile.createdAt.toDate().toISOString().split('T')[0]
        signupsByDate[createdDate] = (signupsByDate[createdDate] || 0) + 1
      }
    }
  }
  
  const result: { date: string; newUsers: number; cumulativeUsers: number }[] = []
  const today = new Date()
  let cumulative = 0
  
  // Count all users before the window
  const windowStart = new Date(today)
  windowStart.setDate(windowStart.getDate() - (days - 1))
  const windowStartStr = windowStart.toISOString().split('T')[0]
  
  for (const [date, count] of Object.entries(signupsByDate)) {
    if (date < windowStartStr) {
      cumulative += count
    }
  }
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const newUsers = signupsByDate[dateStr] || 0
    cumulative += newUsers
    result.push({ date: dateStr, newUsers, cumulativeUsers: cumulative })
  }
  
  return result
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

// ============================================
// Difficulty Level Functions
// ============================================

export interface UserWithDifficulty {
  userId: string
  email: string
  displayName: string | null
  difficultyLevel: DifficultyLevel
}

/**
 * Get all users with their difficulty levels
 */
export async function getAllUsersWithDifficulty(): Promise<UserWithDifficulty[]> {
  const usersRef = collection(db, USERS_COLLECTION)
  const usersSnap = await getDocs(usersRef)
  
  const users: UserWithDifficulty[] = []
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id
    const userData = userDoc.data()
    
    const profileRef = doc(db, USERS_COLLECTION, userId, 'data', 'profile')
    const settingsRef = doc(db, USERS_COLLECTION, userId, 'data', 'settings')
    
    const [profileSnap, settingsSnap] = await Promise.all([
      getDoc(profileRef),
      getDoc(settingsRef)
    ])
    
    const profile = profileSnap.exists() ? profileSnap.data() as UserProfile : null
    const settings = settingsSnap.exists() ? settingsSnap.data() as UserSettings : null
    
    users.push({
      userId,
      email: profile?.email || userData.email || 'Unknown',
      displayName: profile?.displayName || null,
      difficultyLevel: settings?.difficultyLevel || 'proficient'
    })
  }
  
  return users.sort((a, b) => a.email.localeCompare(b.email))
}

/**
 * Set difficulty level for a specific user
 */
export async function setUserDifficultyLevel(
  userId: string,
  level: DifficultyLevel
): Promise<void> {
  const settingsRef = doc(db, USERS_COLLECTION, userId, 'data', 'settings')
  await setDoc(settingsRef, { difficultyLevel: level }, { merge: true })
}

/**
 * Get all difficulty presets (emails pre-assigned to levels)
 */
export async function getDifficultyPresets(): Promise<DifficultyPreset[]> {
  const presetsRef = collection(db, DIFFICULTY_PRESETS_COLLECTION)
  const q = query(presetsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(d => ({
    ...d.data(),
    email: d.id
  } as DifficultyPreset))
}

/**
 * Set a difficulty preset for an email address.
 * Uses the normalized email as the document ID for easy lookup on signup.
 */
export async function setDifficultyPreset(
  email: string,
  level: DifficultyLevel,
  adminEmail: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const presetRef = doc(db, DIFFICULTY_PRESETS_COLLECTION, normalizedEmail)
  
  await setDoc(presetRef, {
    email: normalizedEmail,
    level,
    createdAt: serverTimestamp(),
    updatedBy: adminEmail
  })
}

/**
 * Remove a difficulty preset
 */
export async function removeDifficultyPreset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const presetRef = doc(db, DIFFICULTY_PRESETS_COLLECTION, normalizedEmail)
  await deleteDoc(presetRef)
}

/**
 * Get difficulty preset for a specific email (used during signup)
 */
export async function getDifficultyPresetForEmail(email: string): Promise<DifficultyLevel | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const presetRef = doc(db, DIFFICULTY_PRESETS_COLLECTION, normalizedEmail)
  const presetSnap = await getDoc(presetRef)
  
  if (presetSnap.exists()) {
    return (presetSnap.data() as DifficultyPreset).level
  }
  return null
}
