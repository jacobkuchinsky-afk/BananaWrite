'use client'

import styles from '@/components/UITesting/UITesting.module.css'

export default function UITestingPage() {
  return (
    <div className={styles.testingPage}>
      {/* SVG Filters for sketchy hand-drawn effect */}
      <svg className={styles.svgFilters} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Sketchy filter - creates hand-drawn roughness */}
          <filter id="sketchy-filter" x="-10%" y="-10%" width="120%" height="120%">
            {/* Turbulence creates organic noise */}
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.04" 
              numOctaves="3" 
              result="noise"
            />
            {/* Displacement map warps edges based on noise */}
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
        <h1 className={styles.pageTitle}>UI Testing Sandbox</h1>
        <p className={styles.pageSubtitle}>Experimenting with new styles and components</p>
      </header>

      {/* Sketchy Button Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sketchy / Hand-Drawn Button Style</h2>
        
        {/* Main CTA Button - like "Start Writing" in the mockup */}
        <button className={styles.sketchyButton} type="button">
          <span className={styles.sketchyButtonText}>Start Writing</span>
          <span className={styles.sketchyButtonSubtext}>Your prompt is ready</span>
        </button>

        {/* Outline variant */}
        <button className={styles.sketchyButtonOutline} type="button">
          Test Outline Button
        </button>

        {/* Pill buttons - like email/settings in mockup */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className={styles.sketchyPillButton} type="button">
            user@example.com
          </button>
          <button className={styles.sketchyPillButton} type="button">
            ⚙️ Settings
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.5rem', fontFamily: 'Patrick Hand, cursive' }}>
            Progress: 1/38 skills
          </p>
          <div className={styles.sketchyProgressContainer}>
            <div 
              className={styles.sketchyProgressFill} 
              style={{ width: '10%' }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
