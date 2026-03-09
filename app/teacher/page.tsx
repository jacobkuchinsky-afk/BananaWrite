'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Classroom } from '@/types'
import { getTeacherClassrooms, createClassroom, deleteClassroom } from '@/lib/adminFirestore'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from '@/components/Teacher/Teacher.module.css'

function TeacherDashboardContent() {
  const router = useRouter()
  const { user, loading, isTeacher, isAdmin } = useAuth()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isTeacher && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isTeacher, isAdmin, router])

  useEffect(() => {
    async function loadClassrooms() {
      if (!user?.email) return
      try {
        const data = await getTeacherClassrooms(user.email)
        setClassrooms(data)
      } catch (err) {
        console.error('Error loading classrooms:', err)
      } finally {
        setLoadingData(false)
      }
    }
    if (user && (isTeacher || isAdmin)) loadClassrooms()
  }, [user, isTeacher, isAdmin])

  const handleCreateClassroom = async () => {
    if (!user?.email || !newClassName.trim()) {
      setError('Please enter a class name.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await createClassroom(newClassName.trim(), user.email)
      const data = await getTeacherClassrooms(user.email)
      setClassrooms(data)
      setNewClassName('')
    } catch (err) {
      console.error('Error creating classroom:', err)
      setError('Failed to create classroom.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClassroom = async (id: string) => {
    try {
      await deleteClassroom(id)
      setClassrooms(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting classroom:', err)
    }
  }

  if (loading || loadingData) {
    return (
      <div className={styles.teacherPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading teacher dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || (!isTeacher && !isAdmin)) return null

  return (
    <div className={styles.teacherPage}>
      <header className={styles.teacherHeader}>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeftIcon size={18} /> Dashboard
        </Link>
        <h1 className={styles.pageTitle}>
          <span className={styles.badge}>Teacher</span>
          My Classrooms
        </h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        {/* Quick Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{classrooms.length}</span>
            <span className={styles.statLabel}>Classes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {classrooms.reduce((sum, c) => sum + (c.studentEmails?.length || 0), 0)}
            </span>
            <span className={styles.statLabel}>Total Students</span>
          </div>
        </div>

        {/* Create Class */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Create a New Class</h2>
          <p className={styles.cardDescription}>
            Students will join using a class code you&apos;ll receive after creating it.
          </p>
          <div className={styles.formRow}>
            <input
              type="text"
              value={newClassName}
              onChange={e => { setNewClassName(e.target.value); setError(null) }}
              placeholder="e.g. Period 3 English"
              className={styles.formInput}
              onKeyDown={e => e.key === 'Enter' && handleCreateClassroom()}
            />
            <button
              onClick={handleCreateClassroom}
              disabled={creating}
              className={styles.primaryButton}
            >
              {creating ? 'Creating...' : 'Create Class'}
            </button>
          </div>
          {error && <p className={styles.formError} role="alert">{error}</p>}
        </section>

        {/* Classroom List */}
        {classrooms.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>
              No classrooms yet. Create one above to get started.
            </p>
          </div>
        ) : (
          <div className={styles.classroomGrid}>
            {classrooms.map(classroom => (
              <div key={classroom.id} style={{ position: 'relative' }}>
                <Link
                  href={`/teacher/classroom/${classroom.id}`}
                  className={styles.classroomCard}
                >
                  <span className={styles.classroomName}>{classroom.name}</span>
                  <div className={styles.classroomMeta}>
                    <span>Code: <span className={styles.classroomCode}>{classroom.classCode}</span></span>
                    <span className={styles.classroomStudentCount}>
                      {classroom.studentEmails?.length || 0} students
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); handleDeleteClassroom(classroom.id!) }}
                  className={styles.dangerButton}
                  style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', fontSize: '0.75rem' }}
                  aria-label={`Delete ${classroom.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function TeacherDashboardPage() {
  return <TeacherDashboardContent />
}
