'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AuthCard from '@/components/Auth/AuthCard'
import AuthInput from '@/components/Auth/AuthInput'
import styles from '@/components/Auth/Auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard 
      title="Reset Password" 
      subtitle="Enter your email and we'll send you a reset link"
    >
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {success ? (
        <>
          <div className={styles.successMessage}>
            Password reset email sent! Check your inbox for further instructions.
          </div>
          <div className={styles.authLinks} style={{ marginTop: '1.5rem' }}>
            <Link href="/login" className={styles.authLinkAction}>
              Back to Sign In
            </Link>
          </div>
        </>
      ) : (
        <>
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
            
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Send Reset Link'}
            </button>
          </form>

          <div className={styles.authLinks}>
            <p className={styles.authLink}>
              Remember your password?{' '}
              <Link href="/login" className={styles.authLinkAction}>
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </AuthCard>
  )
}





