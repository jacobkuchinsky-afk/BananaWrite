'use client'

import { useState, useEffect } from 'react'
import {
  getTeacherEmails,
  addTeacher,
  removeTeacher,
  getAllUsersWithDifficulty,
  UserWithDifficulty
} from '@/lib/adminFirestore'
import styles from './Admin.module.css'

export default function TeacherManagementPanel() {
  const [teacherEmails, setTeacherEmails] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<UserWithDifficulty[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [emails, users] = await Promise.all([
        getTeacherEmails(),
        getAllUsersWithDifficulty()
      ])
      setTeacherEmails(emails)
      setAllUsers(users)
    } catch (err) {
      console.error('Error loading teacher data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTeacher(email: string) {
    setAdding(true)
    setError(null)
    try {
      await addTeacher(email)
      const emails = await getTeacherEmails()
      setTeacherEmails(emails)
      setNewEmail('')
    } catch (err) {
      console.error('Error adding teacher:', err)
      setError('Failed to add teacher. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveTeacher(email: string) {
    try {
      await removeTeacher(email)
      const emails = await getTeacherEmails()
      setTeacherEmails(emails)
    } catch (err) {
      console.error('Error removing teacher:', err)
    }
  }

  function handleAddByEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email) { setError('Please enter an email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    if (teacherEmails.includes(email)) { setError('This email is already a teacher.'); return }
    handleAddTeacher(email)
  }

  const nonTeacherUsers = allUsers.filter(u => !teacherEmails.includes(u.email.toLowerCase()))
  const filteredUsers = searchQuery
    ? nonTeacherUsers.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : nonTeacherUsers

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading teacher list...</p>
      </div>
    )
  }

  return (
    <div className={styles.difficultyPanel}>
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Current Teachers</h2>
        <p className={styles.sectionDescription}>
          Teachers can view student progress and manage their classrooms.
        </p>
        <div className={styles.difficultyUserList}>
          {teacherEmails.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>No teachers added yet.</p>
            </div>
          ) : (
            teacherEmails.map(email => {
              const user = allUsers.find(u => u.email.toLowerCase() === email)
              return (
                <div key={email} className={styles.difficultyUserRow}>
                  <div className={styles.difficultyUserInfo}>
                    <span className={styles.difficultyUserName}>{user?.displayName || 'No Name'}</span>
                    <span className={styles.difficultyUserEmail}>{email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveTeacher(email)}
                    className={styles.difficultyRemoveBtn}
                    title="Remove teacher"
                    aria-label={`Remove ${email} as teacher`}
                  >
                    &times;
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Add Teacher by Email</h2>
        <p className={styles.sectionDescription}>
          Enter any email address to grant teacher access.
        </p>
        <div className={styles.difficultyPresetForm}>
          <input
            type="email"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setError(null) }}
            placeholder="teacher@school.edu"
            className={styles.formInput}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAddByEmail()}
          />
          <button
            onClick={handleAddByEmail}
            disabled={adding}
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          >
            {adding ? 'Adding...' : 'Add Teacher'}
          </button>
        </div>
        {error && <p className={styles.formError} role="alert">{error}</p>}
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Promote Existing User</h2>
        <p className={styles.sectionDescription}>
          Click &quot;Make Teacher&quot; next to any existing user to give them teacher access.
        </p>
        <div className={styles.difficultySearchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className={styles.formInput}
          />
        </div>
        <div className={styles.difficultyUserList}>
          {filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                {searchQuery ? 'No matching non-teacher users.' : 'All users are already teachers.'}
              </p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.userId} className={styles.difficultyUserRow}>
                <div className={styles.difficultyUserInfo}>
                  <span className={styles.difficultyUserName}>{user.displayName || 'No Name'}</span>
                  <span className={styles.difficultyUserEmail}>{user.email}</span>
                </div>
                <button
                  onClick={() => handleAddTeacher(user.email)}
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                >
                  Make Teacher
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
