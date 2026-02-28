'use client'

import { useState, useEffect } from 'react'
import {
  DifficultyLevel,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LEVEL_LABELS,
  DifficultyPreset
} from '@/types'
import {
  getAllUsersWithDifficulty,
  setUserDifficultyLevel,
  getDifficultyPresets,
  setDifficultyPreset,
  removeDifficultyPreset,
  UserWithDifficulty
} from '@/lib/adminFirestore'
import styles from './Admin.module.css'

interface DifficultyPanelProps {
  adminEmail: string
}

export default function DifficultyPanel({ adminEmail }: DifficultyPanelProps) {
  const [users, setUsers] = useState<UserWithDifficulty[]>([])
  const [presets, setPresets] = useState<DifficultyPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [savingUser, setSavingUser] = useState<string | null>(null)
  const [newPresetEmail, setNewPresetEmail] = useState('')
  const [newPresetLevel, setNewPresetLevel] = useState<DifficultyLevel>('proficient')
  const [addingPreset, setAddingPreset] = useState(false)
  const [presetError, setPresetError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [usersResult, presetsResult] = await Promise.allSettled([
        getAllUsersWithDifficulty(),
        getDifficultyPresets()
      ])
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value)
      } else {
        console.error('Error loading users:', usersResult.reason)
      }
      if (presetsResult.status === 'fulfilled') {
        setPresets(presetsResult.value)
      } else {
        console.error('Error loading presets:', presetsResult.reason)
      }
    } catch (error) {
      console.error('Error loading difficulty data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLevelChange(userId: string, level: DifficultyLevel) {
    setSavingUser(userId)
    try {
      await setUserDifficultyLevel(userId, level)
      setUsers(prev =>
        prev.map(u => (u.userId === userId ? { ...u, difficultyLevel: level } : u))
      )
    } catch (error) {
      console.error('Error updating difficulty level:', error)
    } finally {
      setSavingUser(null)
    }
  }

  async function handleAddPreset() {
    const email = newPresetEmail.trim().toLowerCase()
    if (!email) {
      setPresetError('Please enter an email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPresetError('Please enter a valid email address.')
      return
    }

    setAddingPreset(true)
    setPresetError(null)
    try {
      await setDifficultyPreset(email, newPresetLevel, adminEmail)
      setNewPresetEmail('')
      setNewPresetLevel('proficient')
      const presetsData = await getDifficultyPresets()
      setPresets(presetsData)
    } catch (error) {
      console.error('Error adding preset:', error)
      setPresetError('Failed to add preset. Please try again.')
    } finally {
      setAddingPreset(false)
    }
  }

  async function handlePresetLevelChange(email: string, level: DifficultyLevel) {
    try {
      await setDifficultyPreset(email, level, adminEmail)
      setPresets(prev =>
        prev.map(p => (p.email === email ? { ...p, level } : p))
      )
    } catch (error) {
      console.error('Error updating preset:', error)
    }
  }

  async function handleRemovePreset(email: string) {
    try {
      await removeDifficultyPreset(email)
      setPresets(prev => prev.filter(p => p.email !== email))
    } catch (error) {
      console.error('Error removing preset:', error)
    }
  }

  const filteredUsers = searchQuery
    ? users.filter(
        u =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : users

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading difficulty levels...</p>
      </div>
    )
  }

  return (
    <div className={styles.difficultyPanel}>
      {/* Existing Users Section */}
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Student Difficulty Levels</h2>
        <p className={styles.sectionDescription}>
          Assign difficulty levels to existing students. Basic = 4th grade, Learning = 6th grade, Proficient = 9th grade.
        </p>

        <div className={styles.difficultySearchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className={styles.formInput}
          />
        </div>

        <div className={styles.difficultyUserList}>
          {filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                {searchQuery ? 'No users match your search.' : 'No users found.'}
              </p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.userId} className={styles.difficultyUserRow}>
                <div className={styles.difficultyUserInfo}>
                  <span className={styles.difficultyUserName}>
                    {user.displayName || 'No Name'}
                  </span>
                  <span className={styles.difficultyUserEmail}>{user.email}</span>
                </div>
                <div className={styles.difficultyToggleGroup}>
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      className={`${styles.difficultyToggle} ${
                        user.difficultyLevel === level ? styles[`difficultyToggleActive_${level}`] : ''
                      }`}
                      onClick={() => handleLevelChange(user.userId, level)}
                      disabled={savingUser === user.userId}
                    >
                      {DIFFICULTY_LEVEL_LABELS[level].split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Presets Section */}
      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Email Presets</h2>
        <p className={styles.sectionDescription}>
          Pre-assign difficulty levels to email addresses. When someone signs up with a matching email,
          they&apos;ll automatically be placed at the right level.
        </p>

        <div className={styles.difficultyPresetForm}>
          <input
            type="email"
            value={newPresetEmail}
            onChange={e => {
              setNewPresetEmail(e.target.value)
              setPresetError(null)
            }}
            placeholder="student@example.com"
            className={styles.formInput}
            style={{ flex: 1 }}
          />
          <select
            value={newPresetLevel}
            onChange={e => setNewPresetLevel(e.target.value as DifficultyLevel)}
            className={styles.difficultySelect}
          >
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level} value={level}>
                {DIFFICULTY_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddPreset}
            disabled={addingPreset}
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          >
            {addingPreset ? 'Adding...' : 'Add Preset'}
          </button>
        </div>
        {presetError && <p className={styles.formError}>{presetError}</p>}

        {presets.length > 0 && (
          <div className={styles.difficultyPresetList}>
            {presets.map(preset => (
              <div key={preset.email} className={styles.difficultyPresetRow}>
                <span className={styles.difficultyPresetEmail}>{preset.email}</span>
                <div className={styles.difficultyToggleGroup}>
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      className={`${styles.difficultyToggle} ${
                        preset.level === level ? styles[`difficultyToggleActive_${level}`] : ''
                      }`}
                      onClick={() => handlePresetLevelChange(preset.email, level)}
                    >
                      {DIFFICULTY_LEVEL_LABELS[level].split(' (')[0]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleRemovePreset(preset.email)}
                  className={styles.difficultyRemoveBtn}
                  title="Remove preset"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {presets.length === 0 && (
          <div className={styles.emptyState} style={{ padding: '2rem' }}>
            <p className={styles.emptyStateText}>
              No email presets configured yet. Add one above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
