'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './Hero.module.css'
import { useScrollContext } from '../ScrollContext'

export default function Hero() {
  const { isScrolled } = useScrollContext()

  const scrollToInfo = () => {
    // Just scroll down a bit to trigger the transition
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        {/* Main content */}
        <div className={styles.content}>
          {/* Left side - Text content */}
          <div className={`${styles.textContent} ${isScrolled ? styles.slideLeft : ''}`}>
            <h1 className={styles.headline}>
              Master the Art<br />of Writing
            </h1>
            <p className={styles.subheadline}>
              Improve your writing skills with interactive lessons and instant feedback
            </p>
            <div className={styles.buttons}>
              <Link href="/signup" className={`btn btn-primary ${styles.btnPrimary}`}>
                Get Started
              </Link>
              <button 
                className={`btn btn-outline ${styles.btnOutline}`}
                onClick={scrollToInfo}
              >
                Info
              </button>
            </div>
          </div>

          {/* Right side - Paper image */}
          <div className={`${styles.phoneContainer} ${isScrolled ? styles.slideRight : ''}`}>
            <Image
              src="/images/paper.jpg"
              alt="BananaWrite App Preview"
              width={550}
              height={650}
              className={styles.phoneImage}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
