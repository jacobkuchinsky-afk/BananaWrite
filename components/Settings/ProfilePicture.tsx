'use client'

import Image from 'next/image'
import styles from './Settings.module.css'

interface ProfilePictureProps {
  photoURL: string | null | undefined
  displayName: string | null | undefined
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  className?: string
}

export default function ProfilePicture({ 
  photoURL, 
  displayName, 
  size = 'medium',
  onClick,
  className = ''
}: ProfilePictureProps) {
  // Get initials from display name or email
  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const sizeClass = {
    small: styles.profilePictureSmall,
    medium: styles.profilePictureMedium,
    large: styles.profilePictureLarge
  }[size]

  const containerClass = `${styles.profilePictureContainer} ${sizeClass} ${className} ${onClick ? styles.clickable : ''}`

  if (photoURL) {
    return (
      <div className={containerClass} onClick={onClick}>
        <Image
          src={photoURL}
          alt="Profile picture"
          fill
          className={styles.profileImage}
        />
      </div>
    )
  }

  return (
    <div className={containerClass} onClick={onClick}>
      <span className={styles.profileInitials}>
        {getInitials(displayName)}
      </span>
    </div>
  )
}




