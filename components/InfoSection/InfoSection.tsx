'use client'

import styles from './InfoSection.module.css'
import { useScrollContext } from '../ScrollContext'

export default function InfoSection() {
  const { isScrolled } = useScrollContext()

  return (
    <section 
      id="info-section" 
      className={`${styles.infoSection} ${isScrolled ? styles.moveUp : ''}`}
    >
      <div className={styles.container}>
        <h2 className={styles.headline}>
          Personalized Learning, Powered by AI
        </h2>
        <p className={styles.description}>
          BananaWrite uses advanced artificial intelligence to understand your unique 
          writing style and skill level. Our system adapts in real-time, providing 
          personalized lessons and feedback tailored specifically to help you improve.
        </p>
        <p className={styles.description}>
          Whether you&apos;re working on grammar, sentence structure, or narrative flow, 
          our AI analyzes your writing patterns and creates a custom learning path just 
          for you. With instant feedback on every exercise, you&apos;ll master the 
          fundamentals of writing faster than ever before.
        </p>
      </div>
    </section>
  )
}
