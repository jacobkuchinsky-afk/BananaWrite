'use client'

import { useCallback } from 'react'
import styles from './Write.module.css'

interface FormattingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>
  onContentChange: () => void
}

export default function FormattingToolbar({ editorRef, onContentChange }: FormattingToolbarProps) {
  // Execute a formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    onContentChange()
    // Keep focus on editor
    editorRef.current?.focus()
  }, [editorRef, onContentChange])

  // Check if a format is currently active
  const isFormatActive = useCallback((command: string): boolean => {
    return document.queryCommandState(command)
  }, [])

  // Handle font size change
  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value
    if (size) {
      execCommand('fontSize', size)
    }
  }, [execCommand])

  // Handle font family change
  const handleFontChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value
    if (font) {
      execCommand('fontName', font)
    }
  }, [execCommand])

  // Indent/Outdent
  const handleIndent = useCallback(() => {
    execCommand('indent')
  }, [execCommand])

  const handleOutdent = useCallback(() => {
    execCommand('outdent')
  }, [execCommand])

  return (
    <div className={styles.formattingToolbar}>
      {/* Font Family */}
      <div className={styles.toolbarGroup}>
        <select 
          className={styles.toolbarSelect}
          onChange={handleFontChange}
          defaultValue=""
          title="Font Family"
        >
          <option value="" disabled>Font</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="Courier New, monospace">Courier New</option>
        </select>
      </div>

      {/* Font Size */}
      <div className={styles.toolbarGroup}>
        <select 
          className={styles.toolbarSelect}
          onChange={handleFontSizeChange}
          defaultValue=""
          title="Font Size"
        >
          <option value="" disabled>Size</option>
          <option value="1">Small</option>
          <option value="2">Normal</option>
          <option value="3">Medium</option>
          <option value="4">Large</option>
          <option value="5">X-Large</option>
          <option value="6">XX-Large</option>
        </select>
      </div>

      <div className={styles.toolbarDivider} />

      {/* Bold */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('bold') ? styles.active : ''}`}
        onClick={() => execCommand('bold')}
        title="Bold (Ctrl+B)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </button>

      {/* Italic */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('italic') ? styles.active : ''}`}
        onClick={() => execCommand('italic')}
        title="Italic (Ctrl+I)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"/>
          <line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </button>

      {/* Underline */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('underline') ? styles.active : ''}`}
        onClick={() => execCommand('underline')}
        title="Underline (Ctrl+U)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
          <line x1="4" y1="21" x2="20" y2="21"/>
        </svg>
      </button>

      <div className={styles.toolbarDivider} />

      {/* Indent */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={handleIndent}
        title="Increase Indent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="6" x2="11" y2="6"/>
          <line x1="21" y1="12" x2="11" y2="12"/>
          <line x1="21" y1="18" x2="11" y2="18"/>
          <polyline points="7 8 3 12 7 16"/>
        </svg>
      </button>

      {/* Outdent */}
      <button
        type="button"
        className={styles.toolbarButton}
        onClick={handleOutdent}
        title="Decrease Indent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="6" x2="11" y2="6"/>
          <line x1="21" y1="12" x2="11" y2="12"/>
          <line x1="21" y1="18" x2="11" y2="18"/>
          <polyline points="3 8 7 12 3 16"/>
        </svg>
      </button>

      <div className={styles.toolbarDivider} />

      {/* Align Left */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('justifyLeft') ? styles.active : ''}`}
        onClick={() => execCommand('justifyLeft')}
        title="Align Left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="17" y1="10" x2="3" y2="10"/>
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="17" y1="18" x2="3" y2="18"/>
        </svg>
      </button>

      {/* Align Center */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('justifyCenter') ? styles.active : ''}`}
        onClick={() => execCommand('justifyCenter')}
        title="Align Center"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="10" x2="6" y2="10"/>
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="18" y1="18" x2="6" y2="18"/>
        </svg>
      </button>

      {/* Align Right */}
      <button
        type="button"
        className={`${styles.toolbarButton} ${isFormatActive('justifyRight') ? styles.active : ''}`}
        onClick={() => execCommand('justifyRight')}
        title="Align Right"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="10" x2="7" y2="10"/>
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="21" y1="18" x2="7" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
