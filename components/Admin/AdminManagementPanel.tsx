'use client'

import { useState, useEffect } from 'react'
import { SUPER_ADMIN_EMAIL } from '@/types'
import {
  getAdminEmails,
  addAdmin,
  removeAdmin,
  getAllUsersWithDifficulty,
  UserWithDifficulty
} from '@/lib/adminFirestore'
import styles from './Admin.module.css'

export default function AdminManagementPanel() {
  const [adminEmails, setAdminEmails] = useState<string[]>([])
  const [allUsers, setAllUsers] = useState<UserWithDifficulty[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [emails, users] = await Promise.all([
        getAdminEmails(),
        getAllUsersWithDifficulty()
      ])
      setAdminEmails(emails)
      setAllUsers(users)
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAdmin(email: string) {
    setAdding(true)
    setError(null)
    try {
      await addAdmin(email)
      const emails = await getAdminEmails()
      setAdminEmails(emails)
      setNewEmail('')
    } catch (err) {
      console.error('Error adding admin:', err)
      setError('Failed to add admin. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveAdmin(email: string) {
    try {
      await removeAdmin(email)
      const emails = await getAdminEmails()
      setAdminEmails(emails)
    } catch (err) {
      console.error('Error removing admin:', err)
    }
  }

  function handleAddByEmail() {
    const email = newEmail.trim().toLowerCase()
    if (!email) {
      setError('Please enter an email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (adminEmails.includes(email)) {
      setError('This email is already an admin.')
      return
    }
    handleAddAdmin(email)
  }

  const superAdminEmail = SUPER_ADMIN_EMAIL.toLowerCase()

  const nonAdminUsers = allUsers.filter(
    u => !adminEmails.includes(u.email.toLowerCase())
  )

  const filteredNonAdminUsers = searchQuery
    ? nonAdminUsers.filter(
        u =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : nonAdminUsers

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading admin list...</p>
      </div>
    )
  }

  return (
    <div className={styles.difficultyPanel}>
      {/* Current Admins */}
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Current Admins</h2>
        <p className={styles.sectionDescription}>
          These users can access the admin panel. Only the super admin can manage this list.
        </p>

        <div className={styles.difficultyUserList}>
          {adminEmails.map(email => {
            const user = allUsers.find(u => u.email.toLowerCase() === email)
            const isSuperAdmin = email === superAdminEmail
            return (
              <div key={email} className={styles.difficultyUserRow}>
                <div className={styles.difficultyUserInfo}>
                  <span className={styles.difficultyUserName}>
                    {user?.displayName || 'No Name'}
                    {isSuperAdmin && (
                      <span className={styles.adminSuperBadge}>Super Admin</span>
                    )}
                  </span>
                  <span className={styles.difficultyUserEmail}>{email}</span>
                </div>
                {!isSuperAdmin && (
                  <button
                    onClick={() => handleRemoveAdmin(email)}
                    className={styles.difficultyRemoveBtn}
                    title="Remove admin"
                  >
                    &times;
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Admin by Email */}
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Add Admin by Email</h2>
        <p className={styles.sectionDescription}>
          Enter any email address to grant admin access. They don&apos;t need to have an account yet.
        </p>

        <div className={styles.difficultyPresetForm}>
          <input
            type="email"
            value={newEmail}
            onChange={e => {
              setNewEmail(e.target.value)
              setError(null)
            }}
            placeholder="email@example.com"
            className={styles.formInput}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAddByEmail()}
          />
          <button
            onClick={handleAddByEmail}
            disabled={adding}
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          >
            {adding ? 'Adding...' : 'Add Admin'}
          </button>
        </div>
        {error && <p className={styles.formError}>{error}</p>}
      </div>

      {/* Promote Existing Users */}
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Promote Existing User</h2>
        <p className={styles.sectionDescription}>
          Click &quot;Promote&quot; next to any existing user to make them an admin.
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
          {filteredNonAdminUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                {searchQuery
                  ? 'No matching non-admin users.'
                  : 'All users are already admins.'}
              </p>
            </div>
          ) : (
            filteredNonAdminUsers.map(user => (
              <div key={user.userId} className={styles.difficultyUserRow}>
                <div className={styles.difficultyUserInfo}>
                  <span className={styles.difficultyUserName}>
                    {user.displayName || 'No Name'}
                  </span>
                  <span className={styles.difficultyUserEmail}>{user.email}</span>
                </div>
                <button
                  onClick={() => handleAddAdmin(user.email)}
                  className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                >
                  Promote
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
