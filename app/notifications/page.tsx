'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import { ReportList, ChatThread, NewReportForm } from '@/components/Notifications'
import { BugReport, BugReportMessage } from '@/types'
import {
  getUserBugReports,
  getBugReportMessages,
  createGeneralBugReport,
  addMessageToBugReport
} from '@/lib/adminFirestore'
import { ArrowLeftIcon, BellIcon } from '@/components/Icons/Icons'
import styles from '@/components/Notifications/Notifications.module.css'

function NotificationsContent() {
  const { user } = useAuth()
  
  // State
  const [reports, setReports] = useState<BugReport[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [messages, setMessages] = useState<BugReportMessage[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Get selected report
  const selectedReport = reports.find(r => r.id === selectedReportId) || null

  // Load user's reports
  const loadReports = useCallback(async () => {
    if (!user) return

    try {
      const userReports = await getUserBugReports(user.uid)
      setReports(userReports)
      
      // Auto-select first report if none selected
      if (userReports.length > 0 && !selectedReportId) {
        setSelectedReportId(userReports[0].id)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoadingReports(false)
    }
  }, [user, selectedReportId])

  // Load messages for selected report
  const loadMessages = useCallback(async () => {
    if (!selectedReportId) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    try {
      const reportMessages = await getBugReportMessages(selectedReportId)
      setMessages(reportMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }, [selectedReportId])

  // Initial load
  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Load messages when selected report changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Handle selecting a report
  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId)
  }

  // Handle creating a new general report
  const handleSubmitNewReport = async (message: string) => {
    if (!user) return

    try {
      const reportId = await createGeneralBugReport({
        userId: user.uid,
        userEmail: user.email || '',
        displayName: user.displayName || null,
        message
      })

      // Reload reports and select the new one
      await loadReports()
      setSelectedReportId(reportId)
    } catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  }

  // Handle sending a message in the chat
  const handleSendMessage = async (content: string) => {
    if (!user || !selectedReportId) return

    try {
      await addMessageToBugReport(selectedReportId, {
        senderId: user.uid,
        senderEmail: user.email || '',
        senderName: user.displayName || null,
        isAdmin: false,
        content
      })

      // Reload messages
      await loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return (
    <div className={styles.notificationsPage}>
      {/* Header */}
      <header className={styles.notificationsHeader}>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeftIcon size={18} />
          Dashboard
        </Link>
        <h1 className={styles.headerTitle}>
          <span className={styles.headerIcon}>
            <BellIcon size={24} />
          </span>
          Notification Center
        </h1>
        <div style={{ width: '120px' }} />
      </header>

      {/* Content */}
      <main className={styles.notificationsContent}>
        {/* Left Panel - New Report Form + Report List */}
        <div className={styles.leftPanel}>
          <NewReportForm 
            onSubmit={handleSubmitNewReport}
            disabled={!user}
          />
          <ReportList
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            loading={loadingReports}
          />
        </div>

        {/* Right Panel - Chat Thread */}
        <div className={styles.rightPanel}>
          <ChatThread
            report={selectedReport}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loadingMessages}
            currentUserId={user?.uid}
          />
        </div>
      </main>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute requireSetup={false}>
      <NotificationsContent />
    </ProtectedRoute>
  )
}
