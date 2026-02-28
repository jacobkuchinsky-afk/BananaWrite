'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthCard from '@/components/Auth/AuthCard'
import AuthInput from '@/components/Auth/AuthInput'
import GoogleButton from '@/components/Auth/GoogleButton'
import styles from '@/components/Auth/Auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, loginWithGoogle, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('Google login error:', err)
      const error = err as { code?: string }
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed
      } else {
        setError('Failed to sign in with Google. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to continue your writing journey">
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />
        
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Sign In'}
        </button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or</span>
        <span className={styles.dividerLine} />
      </div>

      <GoogleButton onClick={handleGoogleLogin} disabled={loading} />

      <div className={styles.authLinks}>
        <Link href="/forgot-password" className={styles.authLinkAction}>
          Forgot your password?
        </Link>
        <p className={styles.authLink}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={styles.authLinkAction}>
            Sign Up
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}





