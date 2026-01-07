'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthCard from '@/components/Auth/AuthCard'
import AuthInput from '@/components/Auth/AuthInput'
import GoogleButton from '@/components/Auth/GoogleButton'
import styles from '@/components/Auth/Auth.module.css'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signup, loginWithGoogle, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await signup(email, password)
      router.push('/verify-email')
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed
      } else {
        setError('Failed to sign up with Google. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Create Account" subtitle="Start your writing journey today">
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <AuthInput
          label="Email"
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
        
        <AuthInput
          label="Password"
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
        />
        
        <AuthInput
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="new-password"
        />
        
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Create Account'}
        </button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or</span>
        <span className={styles.dividerLine} />
      </div>

      <GoogleButton onClick={handleGoogleSignup} disabled={loading} />

      <div className={styles.authLinks}>
        <p className={styles.authLink}>
          Already have an account?{' '}
          <Link href="/login" className={styles.authLinkAction}>
            Sign In
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}





