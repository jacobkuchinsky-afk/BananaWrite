/**
 * TypeScript interfaces for BananaWrite
 */

import { Timestamp } from 'firebase/firestore'

// Session status enum
export type SessionStatus = 'idle' | 'writing' | 'submitted'

// User profile stored in Firestore
export interface UserProfile {
  email: string
  displayName: string | null
  createdAt: Timestamp
  lastActive: Timestamp
}

// User progress tracking
export interface UserProgress {
  currentLesson: number  // Index into WRITING_TECHNIQUES array (0-32, 33 total)
  completedLessons: number[]  // Indices of completed lessons
  totalXP: number
}

// Current session state
export interface CurrentSession {
  status: SessionStatus
  writingTechnique: string  // e.g., "Commas"
  essayPrompt: string  // AI-generated prompt
  essayDraft: string  // User's current essay text
  wordCount: number
  startedAt: Timestamp | null
  lastSavedAt: Timestamp | null
  submittedAt: Timestamp | null
}

// Combined user data structure
export interface UserData {
  profile: UserProfile
  progress: UserProgress
  currentSession: CurrentSession
}

// Default values for new users
export const DEFAULT_USER_PROGRESS: Omit<UserProgress, 'currentLesson'> & { currentLesson: number } = {
  currentLesson: 0,
  completedLessons: [],
  totalXP: 0
}

export const DEFAULT_CURRENT_SESSION: Omit<CurrentSession, 'startedAt' | 'lastSavedAt' | 'submittedAt'> & {
  startedAt: null
  lastSavedAt: null
  submittedAt: null
} = {
  status: 'idle',
  writingTechnique: 'None',
  essayPrompt: '',
  essayDraft: '',
  wordCount: 0,
  startedAt: null,
  lastSavedAt: null,
  submittedAt: null
}

// API response types
export interface StreamChunk {
  type: 'chunk' | 'done' | 'error'
  content: string
}

export interface WritingTechniquesResponse {
  techniques: string[]
  total: number
}

export interface TechniqueByIndexResponse {
  index: number
  technique: string
}

// Flask API request types
export interface GeneratePromptRequest {
  userId: string
  lessonIndex?: number
  writingTechnique?: string
}

// ============================================
// Quiz System Types
// ============================================

// Quiz session status
export type QuizSessionStatus = 'reviewing' | 'quizzing' | 'grading' | 'feedback' | 'complete'

// Quiz requirements from AI
export interface QuizRequirements {
  topic: string
  questionType: string  // 'A,B,C,D' | 'Fill in the blank' | 'type out an answer'
  questionCount: number
}

// Individual quiz question
export interface QuizQuestion {
  question: string
  correctAnswer: string
}

// User's answer for grading
export interface QuizAnswer {
  userAnswer: string
  question: string
  correctAnswer: string
}

// Quiz grading result
export interface QuizGradingResult {
  score: number  // 0-100
  feedback: string
  passed: boolean  // score >= 80
}

// Teacher feedback
export interface TeacherFeedback {
  explanations: string[]  // One per wrong answer
  memoryHooks: string[]   // Tips for remembering
}

// Full quiz session stored in Firestore
export interface QuizSession {
  status: QuizSessionStatus
  essayText: string               // The essay that was reviewed
  essayErrors: string[]           // List of errors found with severity
  rawErrorsResponse: string       // Raw AI response for getting quiz requirements
  learnedTopics: string[]         // Topics passed in quizzes
  currentQuizRequirements: QuizRequirements | null
  currentQuiz: {
    name: string
    questions: QuizQuestion[]
  } | null
  currentQuestionIndex: number    // 0-based index of current question
  userAnswers: QuizAnswer[]       // Answers so far
  quizResults: QuizGradingResult | null
  teacherFeedback: TeacherFeedback | null
  currentFeedbackIndex: number    // For showing feedback one-by-one
  lastQuizResults: string         // For tailoring retry quizzes
  startedAt: Timestamp | null
  completedAt: Timestamp | null
}

// Default quiz session
export const DEFAULT_QUIZ_SESSION: Omit<QuizSession, 'startedAt' | 'completedAt'> & {
  startedAt: null
  completedAt: null
} = {
  status: 'reviewing',
  essayText: '',
  essayErrors: [],
  rawErrorsResponse: '',
  learnedTopics: [],
  currentQuizRequirements: null,
  currentQuiz: null,
  currentQuestionIndex: 0,
  userAnswers: [],
  quizResults: null,
  teacherFeedback: null,
  currentFeedbackIndex: 0,
  lastQuizResults: '',
  startedAt: null,
  completedAt: null
}

// API Response Types for Quiz Endpoints

export interface ReviewEssayResponse {
  has_errors: boolean
  errors: string[]
  marked_essay: string
  problem_count: number
  raw_response: string
}

export interface GetQuizRequirementsResponse {
  completed: boolean
  topic: string | null
  question_type: string | null
  question_count: number
  raw_response: string
}

export interface CreateQuizResponse {
  name: string
  questions: Array<{
    question: string
    correct_answer: string
  }>
  raw_response: string
}

export interface GradeQuizResponse {
  score: number
  feedback: string
  passed: boolean
  raw_response: string
}

export interface GetTeacherFeedbackResponse {
  explanations: string[]
  memory_hooks: string[]
  raw_response: string
}

// ============================================
// User Settings Types (Craziness & Focus)
// ============================================

// Craziness options - 10 levels from mundane to unhinged
export const CRAZINESS_OPTIONS = [
  'Mundane',
  'Ordinary', 
  'Mildly Interesting',
  'Engaging',
  'Quirky',
  'Unusual',
  'Wild',
  'Bizarre',
  'Absurd',
  'Completely Unhinged'
] as const

export type CrazinessLevel = typeof CRAZINESS_OPTIONS[number]

// Focus options - 100 topic categories
export const FOCUS_OPTIONS = [
  'Technology',
  'Science',
  'History',
  'Art',
  'Music',
  'Sports',
  'Food',
  'Travel',
  'Gaming',
  'Nature',
  'Space',
  'Animals',
  'Movies',
  'Books',
  'Fashion',
  'Health',
  'Psychology',
  'Philosophy',
  'Politics',
  'Economics',
  'Architecture',
  'Photography',
  'Dance',
  'Theater',
  'Mythology',
  'Folklore',
  'Mysteries',
  'True Crime',
  'Comedy',
  'Horror',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Adventure',
  'Education',
  'Career',
  'Relationships',
  'Family',
  'Friendship',
  'Social Media',
  'Internet Culture',
  'Memes',
  'Nostalgia',
  'Future Predictions',
  'Inventions',
  'Robots',
  'AI',
  'Virtual Reality',
  'Climate',
  'Ocean',
  'Weather',
  'Geography',
  'Culture',
  'Language',
  'Religion',
  'Spirituality',
  'Meditation',
  'Fitness',
  'Cooking',
  'Baking',
  'Gardening',
  'DIY',
  'Crafts',
  'Art History',
  'Music Theory',
  'Film Making',
  'Writing',
  'Poetry',
  'Comics',
  'Anime',
  'Manga',
  'Board Games',
  'Card Games',
  'Puzzles',
  'Magic Tricks',
  'Circus',
  'Amusement Parks',
  'Holidays',
  'Traditions',
  'Weddings',
  'Parties',
  'Camping',
  'Hiking',
  'Extreme Sports',
  'Motorsports',
  'eSports',
  'Collecting',
  'Antiques',
  'Vintage',
  'Urban Legends',
  'Conspiracies',
  'Paranormal',
  'Dreams',
  'Memory',
  'Creativity',
  'Leadership',
  'Entrepreneurship',
  'Volunteering',
  'Activism',
  'Sustainability',
  'Space Exploration'
] as const

export type FocusTopic = typeof FOCUS_OPTIONS[number]

// Essay type options - Fiction vs Non-Fiction
export const ESSAY_TYPE_OPTIONS = [
  'Fiction',
  'Non-Fiction'
] as const

export type EssayType = typeof ESSAY_TYPE_OPTIONS[number]

// User settings interface
export interface UserSettings {
  craziness: CrazinessLevel
  focus: FocusTopic
  essayType: EssayType
  setupComplete: boolean
}

// Default user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  craziness: 'Engaging',
  focus: 'Technology',
  essayType: 'Non-Fiction',
  setupComplete: false
}


// ============================================
// Admin & App Settings Types
// ============================================

// Admin email constant
export const ADMIN_EMAIL = 'jacob.kuchinsky@gmail.com'

// Global app settings (configurable by admin)
export interface AppSettings {
  maxErrorsForRedo: number         // Default: 2 (max errors to allow fixing)
  sameErrorQuizThreshold: number   // Default: 3 (same error type triggers quiz)
  totalErrorQuizThreshold: number  // Default: 5 (total errors triggers quiz)
  quizPassingScore: number         // Default: 75 (percentage)
  updatedAt: Timestamp | null
  updatedBy: string
}

// Default app settings
export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'updatedAt'> & { updatedAt: null } = {
  maxErrorsForRedo: 2,
  sameErrorQuizThreshold: 3,
  totalErrorQuizThreshold: 5,
  quizPassingScore: 75,
  updatedAt: null,
  updatedBy: ''
}

// Daily analytics data
export interface DailyAnalytics {
  date: string
  totalUsers: number
  essaysSubmitted: number
  quizzesCompleted: number
  quizzesPassed: number
  averageQuizScore: number
  errorTypesBreakdown: Record<string, number>
}

// Active session for admin view
export interface ActiveSession {
  oderId: string  // Note: keeping as-is to match existing code references
  userEmail: string
  displayName: string | null
  sessionType: 'essay' | 'quiz'
  status: string
  startedAt: Timestamp | null
  writingTechnique?: string
  wordCount?: number
  quizTopic?: string
  quizProgress?: string
}