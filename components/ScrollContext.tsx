'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ScrollContextType {
  isScrolled: boolean
}

const ScrollContext = createContext<ScrollContextType>({ isScrolled: false })

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const triggerPoint = 100 // Lock after scrolling just 100px
      const newIsScrolled = scrollPosition > triggerPoint
      
      if (newIsScrolled && !isScrolled) {
        setIsScrolled(true)
        // Immediately lock scroll
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isScrolled])

  // Allow scroll up with wheel when locked
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolled) {
        e.preventDefault()
        if (e.deltaY < 0) {
          // Scrolling up - unlock and scroll to top
          setIsScrolled(false)
          document.body.style.overflow = ''
          document.documentElement.style.overflow = ''
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [isScrolled])

  // Handle touch events for mobile
  useEffect(() => {
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isScrolled) {
        const touchY = e.touches[0].clientY
        const deltaY = touchStartY - touchY
        
        if (deltaY < -50) {
          // Swiping down (scroll up)
          setIsScrolled(false)
          document.body.style.overflow = ''
          document.documentElement.style.overflow = ''
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          e.preventDefault()
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isScrolled])

  return (
    <ScrollContext.Provider value={{ isScrolled }}>
      {children}
    </ScrollContext.Provider>
  )
}

export function useScrollContext() {
  return useContext(ScrollContext)
}

