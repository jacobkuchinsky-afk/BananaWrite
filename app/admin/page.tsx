'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ADMIN_EMAIL, AppSettings } from '@/types'
import { getAppSettings, getAdminDashboardStats, initializeAppSettings } from '@/lib/adminFirestore'
import SettingsPanel from '@/components/Admin/SettingsPanel'
import AnalyticsPanel from '@/components/Admin/AnalyticsPanel'
import ActiveSessionsPanel from '@/components/Admin/ActiveSessionsPanel'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from '@/components/Admin/Admin.module.css'

type TabType = 'settings' | 'analytics' | 'sessions'

function AdminContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('settings')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [stats, setStats] = useState<{
    totalUsers: number
    activeEssays: number
    activeQuizzes: number
    todayEssays: number
    todayQuizzes: number
    todayPassRate: number
  } | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!user || user.email !== ADMIN_EMAIL) return

      try {
        // Initialize settings if needed
        await initializeAppSettings(user.email)
        
        const [settingsData, statsData] = await Promise.all([
          getAppSettings(),
          getAdminDashboardStats()
        ])
        
        setSettings(settingsData)
        setStats(statsData)
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    if (user && user.email === ADMIN_EMAIL) {
      loadData()
    }
  }, [user])

  // Handle settings update
  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings)
  }

  // Loading state
  if (loading || loadingData) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Not admin - should redirect but show nothing while redirecting
  if (!user || user.email !== ADMIN_EMAIL) {
    return null
  }

  return (
    <div className={styles.adminPage}>
      {/* Header */}
      <header className={styles.adminHeader}>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeftIcon size={18} /> Dashboard
        </Link>
        <h1 className={styles.adminTitle}>
          <span className={styles.adminBadge}>Admin</span>
          Control Panel
        </h1>
        <div style={{ width: '120px' }} />
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        <button
          className={\\ \\}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={\\ \\}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={\\ \\}
          onClick={() => setActiveTab('sessions')}
        >
          Active Sessions
          {stats && (stats.activeEssays + stats.activeQuizzes) > 0 && (
            <span className={styles.sessionBadge}>
              {stats.activeEssays + stats.activeQuizzes}
            </span>
          )}
        </button>
      </nav>

      {/* Content */}
      <main className={styles.adminContent}>
        {/* Quick Stats Bar */}
        {stats && (
          <div className={styles.quickStats}>
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>{stats.totalUsers}</span>
              <span className={styles.quickStatLabel}>Total Users</span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>{stats.todayEssays}</span>
              <span className={styles.quickStatLabel}>Essays Today</span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>{stats.todayQuizzes}</span>
              <span className={styles.quickStatLabel}>Quizzes Today</span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStatItem}>
              <span className={styles.quickStatValue}>{stats.todayPassRate}%</span>
              <span className={styles.quickStatLabel}>Pass Rate</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'settings' && settings && (
            <SettingsPanel 
              settings={settings} 
              onUpdate={handleSettingsUpdate}
              userEmail={user.email}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPanel />
          )}
          {activeTab === 'sessions' && (
            <ActiveSessionsPanel />
          )}
        </div>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return <AdminContent />
}
