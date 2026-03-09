import { initializeApp, getApps } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

if (process.env.NODE_ENV !== 'production') {
  console.log('Firebase config loaded:', {
    apiKey: firebaseConfig.apiKey ? '✓ set' : '✗ MISSING',
    authDomain: firebaseConfig.authDomain || '✗ MISSING',
    projectId: firebaseConfig.projectId || '✗ MISSING',
    storageBucket: firebaseConfig.storageBucket ? '✓ set' : '✗ MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ set' : '✗ MISSING',
    appId: firebaseConfig.appId ? '✓ set' : '✗ MISSING',
  })
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration missing. Check your environment variables.')
}

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Auth
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

// Google Provider
const googleProvider = new GoogleAuthProvider()

export { 
  auth, 
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
}

export type { User }
