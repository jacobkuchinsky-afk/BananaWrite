'use client'

import { useRef, useEffect, useCallback } from 'react'
import FormattingToolbar from './FormattingToolbar'
import styles from './Write.module.css'

interface WritingAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

// Extract plain text from HTML for word counting and storage
function extractPlainText(html: string): string {
  if (typeof document === 'undefined') return html
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

export default function WritingArea({ 
  value, 
  onChange, 
  placeholder = 'Start writing your essay here...',
  disabled = false
}: WritingAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  // Initialize content when value changes externally
  useEffect(() => {
    const editor = editorRef.current
    if (editor && !isInternalChange.current) {
      // Only update if the plain text is different (to preserve formatting during edits)
      const currentPlainText = extractPlainText(editor.innerHTML)
      if (currentPlainText !== value) {
        // If value is plain text without HTML, just set it
        if (value === extractPlainText(value)) {
          editor.innerText = value
        } else {
          editor.innerHTML = value
        }
      }
    }
    isInternalChange.current = false
  }, [value])

  // Handle content changes from the editor
  const handleInput = useCallback(() => {
    const editor = editorRef.current
    if (editor) {
      isInternalChange.current = true
      // Pass the plain text for word counting and storage
      const plainText = extractPlainText(editor.innerHTML)
      onChange(plainText)
    }
  }, [onChange])

  // Handle paste - allow formatted text
  const handlePaste = useCallback((_e: React.ClipboardEvent) => {
    // Let the browser handle paste normally for rich text
    // The input event will handle updating the value
  }, [])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        document.execCommand('outdent')
      } else {
        document.execCommand('indent')
      }
      handleInput()
    }
  }, [handleInput])

  // Focus the editor on mount
  useEffect(() => {
    const editor = editorRef.current
    let timeoutId: NodeJS.Timeout | null = null
    
    if (editor && !disabled) {
      // Small delay to ensure the element is ready
      timeoutId = setTimeout(() => {
        editor.focus()
      }, 100)
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [disabled])

  return (
    <div className={styles.writingSection}>
      <FormattingToolbar editorRef={editorRef} onContentChange={handleInput} />
      <div
        ref={editorRef}
        className={styles.writingArea}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        spellCheck={true}
        suppressContentEditableWarning={true}
        role="textbox"
        aria-label="Essay writing area"
        aria-multiline="true"
      />
    </div>
  )
}





