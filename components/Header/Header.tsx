'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { user, logout, loading, isAdmin } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/">
          <Image
            src="/images/Logo.png"
            alt="BananaWrite"
            width={400}
            height={110}
            className={styles.logo}
            priority
          />
        </Link>
        
        {!loading && (
          <nav className={styles.nav}>
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className={styles.adminLink}>
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" className={styles.navLink}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className={styles.btnOutline}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.navLink}>
                  Sign In
                </Link>
                <Link href="/signup" className={styles.btnPrimary}>
                  Get Started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
