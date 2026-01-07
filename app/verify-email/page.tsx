'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AuthCard from '@/components/Auth/AuthCard'
import styles from '@/components/Auth/Auth.module.css'

export default function VerifyEmailPage() {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const { resendVerificationEmail, user } = useAuth()

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    setResendSuccess(false)

    try {
      await resendVerificationEmail()
      setResendSuccess(true)
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before trying again.')
      } else {
        setError('Failed to resend email. Please try again.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthCard 
      title="Verify Your Email" 
      subtitle="We've sent you a verification link"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          margin: '0 auto 1.5rem',
          backgroundColor: 'rgba(26, 26, 26, 0.05)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#1a1a1a"/>
          </svg>
        </div>

        <p style={{ 
          color: 'var(--color-text-secondary)', 
          marginBottom: '1rem',
          lineHeight: 1.6
        }}>
          Please check your email{user?.email ? ` at ${user.email}` : ''} and click the verification link to activate your account.
        </p>

        {error && <div className={styles.errorMessage} style={{ marginBottom: '1rem' }}>{error}</div>}
        
        {resendSuccess && (
          <div className={styles.successMessage} style={{ marginBottom: '1rem' }}>
            Verification email sent successfully!
          </div>
        )}

        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '0.9375rem',
          marginBottom: '1.5rem'
        }}>
          Didn&apos;t receive the email?{' '}
          <button 
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              cursor: resendLoading ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              opacity: resendLoading ? 0.6 : 1
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend'}
          </button>
        </p>

        <div className={styles.authLinks}>
          <Link href="/login" className={styles.authLinkAction}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthCard>
  )
}





