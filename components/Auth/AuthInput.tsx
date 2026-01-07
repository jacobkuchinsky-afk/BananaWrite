'use client'

import styles from './Auth.module.css'
import { InputHTMLAttributes } from 'react'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function AuthInput({ label, id, ...props }: AuthInputProps) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.inputLabel}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        {...props}
      />
    </div>
  )
}





