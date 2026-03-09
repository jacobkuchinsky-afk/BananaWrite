'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { GRADE_WRITING_TECHNIQUES, DifficultyLevel } from '@/types'
import {
  getAllStudents,
  getTeacherFolderEmails,
  addStudentToFolder,
  removeStudentFromFolder,
  StudentOverview
} from '@/lib/adminFirestore'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from '@/components/Teacher/Teacher.module.css'

type ViewFilter = 'all' | 'my_class'

function TeacherDashboardContent() {
  const router = useRouter()
  const { user, loading, isTeacher, isAdmin } = useAuth()
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [folderEmails, setFolderEmails] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && !isTeacher && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isTeacher, isAdmin, router])

  useEffect(() => {
    async function loadData() {
      if (!user?.email) return
      try {
        const [allStudents, folder] = await Promise.all([
          getAllStudents(),
          getTeacherFolderEmails(user.email)
        ])
        setStudents(allStudents)
        setFolderEmails(folder)
      } catch (err) {
        console.error('Error loading students:', err)
      } finally {
        setLoadingData(false)
      }
    }
    if (user && (isTeacher || isAdmin)) loadData()
  }, [user, isTeacher, isAdmin])

  const handleAddToFolder = async (studentEmail: string) => {
    if (!user?.email) return
    try {
      await addStudentToFolder(user.email, studentEmail)
      setFolderEmails(prev => [...prev, studentEmail.toLowerCase()])
    } catch (err) {
      console.error('Error adding to folder:', err)
    }
  }

  const handleRemoveFromFolder = async (studentEmail: string) => {
    if (!user?.email) return
    try {
      await removeStudentFromFolder(user.email, studentEmail)
      setFolderEmails(prev => prev.filter(e => e !== studentEmail.toLowerCase()))
    } catch (err) {
      console.error('Error removing from folder:', err)
    }
  }

  const isInFolder = (email: string) => folderEmails.includes(email.toLowerCase())

  const getSkillName = (student: StudentOverview) => {
    const techniques = GRADE_WRITING_TECHNIQUES[student.difficultyLevel as DifficultyLevel]
    return techniques?.[student.currentLesson] || 'Commas'
  }

  const filteredStudents = useMemo(() => {
    let list = students
    if (viewFilter === 'my_class') {
      list = list.filter(s => isInFolder(s.email))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.email.toLowerCase().includes(q) ||
        (s.displayName && s.displayName.toLowerCase().includes(q))
      )
    }
    return list
  }, [students, viewFilter, searchQuery, folderEmails])

  const myClassCount = students.filter(s => isInFolder(s.email)).length
  const writingCount = students.filter(s => s.sessionStatus === 'writing').length

  if (loading || loadingData) {
    return (
      <div className={styles.teacherPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading students...</p>
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
          Students
        </h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        {/* Quick Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{students.length}</span>
            <span className={styles.statLabel}>All Students</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{myClassCount}</span>
            <span className={styles.statLabel}>Your Class</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{writingCount}</span>
            <span className={styles.statLabel}>Currently Writing</span>
          </div>
        </div>

        {/* Filters & Search */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.filterToggle} role="group" aria-label="Filter students">
              <button
                className={viewFilter === 'all' ? styles.filterActive : styles.filterButton}
                onClick={() => setViewFilter('all')}
              >
                All Students ({students.length})
              </button>
              <button
                className={viewFilter === 'my_class' ? styles.filterActive : styles.filterButton}
                onClick={() => setViewFilter('my_class')}
              >
                Your Class ({myClassCount})
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className={styles.formInput}
              style={{ maxWidth: 400 }}
            />
          </div>

          {/* Student Table */}
          {filteredStudents.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                {viewFilter === 'my_class' && myClassCount === 0
                  ? 'No students in Your Class yet. Click the + button next to a student to add them.'
                  : searchQuery
                    ? 'No students match your search.'
                    : 'No students found.'}
              </p>
            </div>
          ) : (
            <table className={styles.rosterTable}>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Current Skill</th>
                  <th scope="col">Lessons</th>
                  <th scope="col">XP</th>
                  <th scope="col">Status</th>
                  <th scope="col">Your Class</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const inFolder = isInFolder(student.email)
                  return (
                    <tr
                      key={student.userId}
                      onClick={() => router.push(`/teacher/student/${student.userId}`)}
                    >
                      <td>
                        <div className={styles.studentName}>
                          {student.displayName || 'No Name'}
                        </div>
                        <div className={styles.studentEmail}>{student.email}</div>
                      </td>
                      <td>{getSkillName(student)}</td>
                      <td>{student.completedLessons.length}</td>
                      <td>{student.totalXP}</td>
                      <td>
                        <span className={
                          student.sessionStatus === 'writing' ? styles.statusWriting
                          : student.sessionStatus === 'submitted' ? styles.statusQuiz
                          : styles.statusIdle
                        }>
                          {student.sessionStatus}
                        </span>
                      </td>
                      <td>
                        {inFolder ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromFolder(student.email) }}
                            className={styles.folderButtonActive}
                            aria-label={`Remove ${student.displayName || student.email} from Your Class`}
                            title="Remove from Your Class"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToFolder(student.email) }}
                            className={styles.folderButton}
                            aria-label={`Add ${student.displayName || student.email} to Your Class`}
                            title="Add to Your Class"
                          >
                            +
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}

export default function TeacherDashboardPage() {
  return <TeacherDashboardContent />
}
