'use client'

import { useState } from 'react'
import styles from '@/components/UITesting/UITesting.module.css'

export default function UITestingPage() {
  const [sliderValue, setSliderValue] = useState(50)
  const [selectedOption, setSelectedOption] = useState<number | null>(1)
  const [selectedPill, setSelectedPill] = useState<number | null>(0)
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className={styles.testingPage}>
      {/* SVG Filters for sketchy hand-drawn effect */}
      <svg className={styles.svgFilters} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="sketchy-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.04" 
              numOctaves="3" 
              result="noise"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="2" 
              xChannelSelector="R" 
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <header>
        <h1 className={styles.pageTitle}>UI Component Showcase</h1>
        <p className={styles.pageSubtitle}>Sketchy 3D Hand-Drawn Style</p>
      </header>

      {/* ==================== BUTTONS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>1. Buttons</h2>
        
        {/* Large CTA Button */}
        <button className={styles.sketchyButton} type="button">
          <span className={styles.sketchyButtonText}>Start Writing</span>
          <span className={styles.sketchyButtonSubtext}>Your prompt is ready</span>
        </button>

        <div className={styles.componentRow}>
          {/* Primary Button */}
          <button className={styles.sketchyButtonPrimary} type="button">
            Primary Button
          </button>

          {/* Outline Button */}
          <button className={styles.sketchyButtonOutline} type="button">
            Outline Button
          </button>
        </div>

        <div className={styles.componentRow}>
          {/* Pill Buttons */}
          <button className={styles.sketchyPillButton} type="button">
            user@example.com
          </button>
          <button className={styles.sketchyPillButton} type="button">
            Settings
          </button>
        </div>

        <div className={styles.componentRow}>
          {/* Icon Button */}
          <button className={styles.sketchyIconButton} type="button">
            +
          </button>
          <button className={styles.sketchyIconButton} type="button">
            X
          </button>
          <button className={styles.sketchyIconButton} type="button">
            ?
          </button>
        </div>

        {/* Google Button */}
        <button className={styles.sketchyGoogleButton} type="button">
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </section>

      {/* ==================== TEXT INPUTS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>2. Text Inputs</h2>
        
        {/* Standard Input */}
        <input 
          type="text" 
          className={styles.sketchyInput} 
          placeholder="Enter your email..."
        />

        {/* Search Input */}
        <div className={styles.sketchySearchWrapper}>
          <span className={styles.sketchySearchIcon}>&#128269;</span>
          <input 
            type="text" 
            className={styles.sketchySearchInput} 
            placeholder="Search topics..."
          />
        </div>

        {/* Textarea */}
        <textarea 
          className={styles.sketchyTextarea} 
          placeholder="Write your essay here..."
          rows={4}
        />
      </section>

      {/* ==================== PROGRESS BARS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>3. Progress Bars</h2>
        
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>Default (30%)</p>
            <div className={styles.sketchyProgressContainer}>
              <div className={styles.sketchyProgressFill} style={{ width: '30%' }} />
            </div>
          </div>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#22c55e' }}>Complete (100%)</p>
            <div className={styles.sketchyProgressContainer}>
              <div className={styles.sketchyProgressFillComplete} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#f59e0b' }}>Warning (75%)</p>
            <div className={styles.sketchyProgressContainer}>
              <div className={styles.sketchyProgressFillWarning} style={{ width: '75%' }} />
            </div>
          </div>

          <div style={{ width: '100%', textAlign: 'center' }}>
            <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>Over limit (110%)</p>
            <div className={styles.sketchyProgressContainer}>
              <div className={styles.sketchyProgressFillError} style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SELECTION COMPONENTS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>4. Selection Components</h2>
        
        {/* Grid Option Cards */}
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Grid Option Cards (click to select)</p>
        <div className={styles.componentGrid}>
          {['Casual', 'Normal', 'Formal', 'Academic'].map((label, i) => (
            <button
              key={i}
              className={`${styles.sketchyOptionCard} ${selectedOption === i ? styles.selected : ''}`}
              onClick={() => setSelectedOption(i)}
              type="button"
            >
              <span className={styles.sketchyOptionIcon}>
                {['&#128522;', '&#128578;', '&#128188;', '&#127891;'][i]}
              </span>
              <span className={styles.sketchyOptionLabel}>{label}</span>
            </button>
          ))}
        </div>

        {/* Pill Toggles */}
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', marginTop: '1rem' }}>Pill Toggles</p>
        <div className={styles.componentRow}>
          {['Commas', 'Periods', 'Semicolons', 'Colons'].map((label, i) => (
            <button
              key={i}
              className={`${styles.sketchyPillToggle} ${selectedPill === i ? styles.selected : ''}`}
              onClick={() => setSelectedPill(i)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Quiz Options */}
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem', marginTop: '1rem' }}>Quiz Options</p>
        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {['The quick brown fox', 'A lazy dog sleeps', 'Mountains are tall', 'Rivers flow downstream'].map((text, i) => (
            <button
              key={i}
              className={`${styles.sketchyQuizOption} ${selectedQuiz === i ? styles.selected : ''}`}
              onClick={() => setSelectedQuiz(i)}
              type="button"
            >
              <span className={styles.sketchyQuizLetter}>{String.fromCharCode(65 + i)}</span>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ==================== CARDS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>5. Cards</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
          {/* Auth Card */}
          <div className={styles.sketchyAuthCard}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h3>
            <p style={{ color: '#666', fontSize: '0.9375rem' }}>Sign in to continue learning</p>
          </div>

          {/* Content Card */}
          <div className={styles.sketchyContentCard}>
            <span className={styles.sketchyContentLabel}>Writing Prompt</span>
            <p className={styles.sketchyContentText}>
              Describe a time when you overcame a significant challenge in your life.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
          {/* Feedback Card */}
          <div className={styles.sketchyFeedbackCard}>
            <div className={styles.sketchyFeedbackTitle}>
              <span>&#128161;</span> Tip
            </div>
            <p className={styles.sketchyFeedbackText}>
              Remember to use commas before coordinating conjunctions when joining independent clauses.
            </p>
          </div>

          {/* Success Card */}
          <div className={styles.sketchySuccessCard}>
            <div className={styles.sketchySuccessTitle}>
              <span>&#10004;</span> Great Job!
            </div>
            <p className={styles.sketchySuccessText}>
              You&apos;ve mastered semicolons. Keep up the excellent work!
            </p>
          </div>
        </div>
      </section>

      {/* ==================== BADGES ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>6. Badges &amp; Pills</h2>
        
        <div className={styles.componentRow}>
          <span className={styles.sketchyBadge}>Skill: Commas</span>
          <span className={styles.sketchyBadge}>Lesson 5</span>
          <span className={styles.sketchyXpBadge}>+50 XP</span>
          <span className={styles.sketchyNotificationBadge}>3</span>
        </div>
      </section>

      {/* ==================== MESSAGES ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>7. Message Boxes</h2>
        
        <div className={styles.sketchyErrorMessage}>
          <strong>Error:</strong> Please check your email and try again.
        </div>

        <div className={styles.sketchySuccessMessage}>
          <strong>Success!</strong> Your essay has been submitted.
        </div>

        <div className={styles.sketchyWarningBanner}>
          <strong>Notice:</strong> Your email is not verified. Please check your inbox.
        </div>
      </section>

      {/* ==================== SLIDER ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>8. Slider</h2>
        
        <div className={styles.sketchySliderContainer}>
          <div className={styles.sketchySliderValue}>{sliderValue}</div>
          <input
            type="range"
            className={styles.sketchySlider}
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
          />
          <p style={{ fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>Word count target</p>
        </div>
      </section>

      {/* ==================== STEP INDICATORS ==================== */}
      <section className={styles.sectionWide}>
        <h2 className={styles.sectionTitle}>9. Step Indicators</h2>
        
        <div className={styles.sketchyStepsContainer}>
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              className={`${styles.sketchyStepDot} ${
                step < activeStep ? styles.completed : ''
              } ${step === activeStep ? styles.active : ''}`}
              onClick={() => setActiveStep(step)}
              type="button"
              aria-label={`Step ${step + 1}`}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
          Click dots to change step (current: {activeStep + 1}/5)
        </p>
      </section>
    </div>
  )
}
