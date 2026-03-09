'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Classroom, GRADE_WRITING_TECHNIQUES, DifficultyLevel } from '@/types'
import {
  getClassroomById,
  getClassroomStudents,
  removeStudentFromClassroom,
  StudentOverview
} from '@/lib/adminFirestore'
import { ArrowLeftIcon } from '@/components/Icons/Icons'
import styles from '@/components/Teacher/Teacher.module.css'

function ClassroomContent() {
  const router = useRouter()
  const params = useParams()
  const classroomId = params.id as string
  const { user, loading, isTeacher, isAdmin } = useAuth()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !isTeacher && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isTeacher, isAdmin, router])

  useEffect(() => {
    async function loadData() {
      try {
        const [cls, studs] = await Promise.all([
          getClassroomById(classroomId),
          getClassroomStudents(classroomId)
        ])
        setClassroom(cls)
        setStudents(studs)
      } catch (err) {
        console.error('Error loading classroom:', err)
      } finally {
        setLoadingData(false)
      }
    }
    if (user && (isTeacher || isAdmin) && classroomId) loadData()
  }, [user, isTeacher, isAdmin, classroomId])

  const handleRemoveStudent = async (email: string) => {
    try {
      await removeStudentFromClassroom(classroomId, email)
      setStudents(prev => prev.filter(s => s.email.toLowerCase() !== email.toLowerCase()))
    } catch (err) {
      console.error('Error removing student:', err)
    }
  }

  const getSkillName = (student: StudentOverview) => {
    const techniques = GRADE_WRITING_TECHNIQUES[student.difficultyLevel as DifficultyLevel]
    return techniques?.[student.currentLesson] || 'Commas'
  }

  if (loading || loadingData) {
    return (
      <div className={styles.teacherPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading classroom...</p>
        </div>
      </div>
    )
  }

  if (!user || (!isTeacher && !isAdmin) || !classroom) return null

  return (
    <div className={styles.teacherPage}>
      <header className={styles.teacherHeader}>
        <Link href="/teacher" className={styles.backButton}>
          <ArrowLeftIcon size={18} /> Classes
        </Link>
        <h1 className={styles.pageTitle}>
          <span className={styles.badge}>Class</span>
          {classroom.name}
        </h1>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{students.length}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {students.filter(s => s.sessionStatus === 'writing').length}
            </span>
            <span className={styles.statLabel}>Currently Writing</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {students.length > 0
                ? Math.round(students.reduce((s, st) => s + st.completedLessons.length, 0) / students.length)
                : 0}
            </span>
            <span className={styles.statLabel}>Avg Lessons Done</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.classroomCode} style={{ fontSize: '1.5rem' }}>
              {classroom.classCode}
            </span>
            <span className={styles.statLabel}>Join Code</span>
          </div>
        </div>

        {/* Roster */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Student Roster</h2>
          {students.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                No students have joined yet. Share the code <strong>{classroom.classCode}</strong> with your students.
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
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
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
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.email) }}
                        className={styles.dangerButton}
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        aria-label={`Remove ${student.displayName || student.email}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}

export default function ClassroomPage() {
  return <ClassroomContent />
}
