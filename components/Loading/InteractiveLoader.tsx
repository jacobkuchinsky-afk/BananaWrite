'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './Loading.module.css'

interface Orb {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: 'small' | 'medium' | 'large' | 'xl'
  color: 'primary' | 'yellow' | 'gray' | 'red' | 'blue' | 'green'
  baseX: number
  baseY: number
  radius: number
  mass: number
  pulsePhase: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface InteractiveLoaderProps {
  title?: string
  subtitle?: string
  streamedText?: string
  isStreaming?: boolean
}

export default function InteractiveLoader({
  title = 'Crafting your prompt...',
  subtitle = 'Move your mouse to play with the orbs',
  streamedText = '',
  isStreaming = true
}: InteractiveLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [orbs, setOrbs] = useState<Orb[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [gravityMode, setGravityMode] = useState(false)
  const [shockwaveActive, setShockwaveActive] = useState(false)
  const [shockwavePos, setShockwavePos] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>()
  const isDraggingRef = useRef<number | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const mouseVelocityRef = useRef({ x: 0, y: 0 })
  const particleIdRef = useRef(0)

  // Get orb radius from size
  const getRadius = (size: string): number => {
    switch (size) {
      case 'small': return 20
      case 'medium': return 35
      case 'large': return 55
      case 'xl': return 80
      default: return 35
    }
  }

  // Get mass from size
  const getMass = (size: string): number => {
    switch (size) {
      case 'small': return 1
      case 'medium': return 2
      case 'large': return 4
      case 'xl': return 8
      default: return 2
    }
  }

  // Initialize orbs
  useEffect(() => {
    if (typeof window === 'undefined') return

    const sizes: Array<'small' | 'medium' | 'large' | 'xl'> = ['small', 'medium', 'large', 'xl']
    const colors: Array<'primary' | 'yellow' | 'gray' | 'red' | 'blue' | 'green'> = ['primary', 'yellow', 'gray', 'red', 'blue', 'green']
    
    const newOrbs: Orb[] = []
    const orbCount = 12

    for (let i = 0; i < orbCount; i++) {
      const x = Math.random() * (window.innerWidth - 200) + 100
      const y = Math.random() * (window.innerHeight - 200) + 100
      const size = sizes[Math.floor(Math.random() * sizes.length)]
      newOrbs.push({
        id: i,
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseX: x,
        baseY: y,
        radius: getRadius(size),
        mass: getMass(size),
        pulsePhase: Math.random() * Math.PI * 2
      })
    }

    setOrbs(newOrbs)
  }, [])

  // Spawn particles at collision point - optimized count
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string, intensity: number = 1) => {
    const actualCount = Math.min(count, 8) // Cap particles for performance
    const newParticles: Particle[] = []
    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.PI * 2 / actualCount) * i + Math.random() * 0.5
      const speed = (2 + Math.random() * 3) * intensity
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3
      })
    }
    setParticles(prev => [...prev.slice(-50), ...newParticles]) // Keep max 50 particles
  }, [])

  // SHOCKWAVE - Press SPACE for massive explosion!
  const triggerShockwave = useCallback(() => {
    setShockwaveActive(true)
    setShockwavePos({ x: mousePos.x, y: mousePos.y })
    
    // Spawn explosion particles
    spawnParticles(mousePos.x, mousePos.y, 12, '#fef08a', 2)
    
    // Apply massive force to all orbs
    setOrbs(prev => prev.map(orb => {
      const dx = orb.x - mousePos.x
      const dy = orb.y - mousePos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 0) {
        const force = Math.max(0, (600 - dist) / 600) * 50
        const nx = dx / dist
        const ny = dy / dist
        
        return {
          ...orb,
          vx: orb.vx + nx * force,
          vy: orb.vy + ny * force
        }
      }
      return orb
    }))
    
    setTimeout(() => setShockwaveActive(false), 300)
  }, [mousePos, spawnParticles])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          triggerShockwave()
          break
        case 'KeyG':
          setGravityMode(prev => !prev)
          break
        case 'KeyR':
          // Reset orbs to original positions with some flair
          setOrbs(prev => prev.map(orb => ({
            ...orb,
            vx: (orb.baseX - orb.x) * 0.1,
            vy: (orb.baseY - orb.y) * 0.1
          })))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerShockwave])

  // Mouse tracking with velocity
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Calculate mouse velocity for throwing
    mouseVelocityRef.current = {
      x: e.clientX - lastMousePosRef.current.x,
      y: e.clientY - lastMousePosRef.current.y
    }
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
    
    setMousePos({ x: e.clientX, y: e.clientY })

    // If dragging an orb, update its position
    if (isDraggingRef.current !== null) {
      setOrbs(prev => prev.map(orb => {
        if (orb.id === isDraggingRef.current) {
          return {
            ...orb,
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y,
            vx: mouseVelocityRef.current.x * 0.5,
            vy: mouseVelocityRef.current.y * 0.5
          }
        }
        return orb
      }))
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current !== null) {
      // POWERFUL throw based on mouse velocity!
      const throwMultiplier = 3
      setOrbs(prev => prev.map(orb => {
        if (orb.id === isDraggingRef.current) {
          return {
            ...orb,
            vx: mouseVelocityRef.current.x * throwMultiplier,
            vy: mouseVelocityRef.current.y * throwMultiplier
          }
        }
        return orb
      }))
      isDraggingRef.current = null
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Main physics animation loop
  useEffect(() => {
    let lastTime = performance.now()
    
    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2) // Cap at 2x speed
      lastTime = currentTime

      // Update particles
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx * deltaTime,
          y: p.y + p.vy * deltaTime,
          vy: p.vy + 0.2 * deltaTime, // gravity on particles
          life: p.life - (deltaTime * 0.05) / p.maxLife
        }))
        .filter(p => p.life > 0)
      )

      setOrbs(prev => {
        const newOrbs = [...prev]
        
        // Check orb-to-orb collisions
        for (let i = 0; i < newOrbs.length; i++) {
          for (let j = i + 1; j < newOrbs.length; j++) {
            const orbA = newOrbs[i]
            const orbB = newOrbs[j]
            
            const dx = orbB.x - orbA.x
            const dy = orbB.y - orbA.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = orbA.radius + orbB.radius
            
            if (dist < minDist && dist > 0) {
              // Collision response with momentum
              const nx = dx / dist
              const ny = dy / dist
              
              // Relative velocity
              const dvx = orbA.vx - orbB.vx
              const dvy = orbA.vy - orbB.vy
              const dvn = dvx * nx + dvy * ny
              
              // Only resolve if objects moving toward each other
              if (dvn > 0) {
                const restitution = 0.9 // Bouncy!
                const totalMass = orbA.mass + orbB.mass
                
                const impulse = (2 * dvn * restitution) / totalMass
                
                newOrbs[i] = {
                  ...orbA,
                  vx: orbA.vx - impulse * orbB.mass * nx,
                  vy: orbA.vy - impulse * orbB.mass * ny
                }
                
                newOrbs[j] = {
                  ...orbB,
                  vx: orbB.vx + impulse * orbA.mass * nx,
                  vy: orbB.vy + impulse * orbA.mass * ny
                }
                
                // Separate overlapping orbs
                const overlap = minDist - dist
                const separationX = (overlap / 2 + 1) * nx
                const separationY = (overlap / 2 + 1) * ny
                newOrbs[i].x -= separationX
                newOrbs[i].y -= separationY
                newOrbs[j].x += separationX
                newOrbs[j].y += separationY
                
                // Spawn collision particles only for hard hits
                const speed = Math.sqrt(dvx * dvx + dvy * dvy)
                if (speed > 8) {
                  const collisionX = (orbA.x + orbB.x) / 2
                  const collisionY = (orbA.y + orbB.y) / 2
                  const particleColor = orbA.color === 'yellow' || orbB.color === 'yellow' ? '#fef08a' : 
                                       orbA.color === 'red' || orbB.color === 'red' ? '#f87171' :
                                       orbA.color === 'blue' || orbB.color === 'blue' ? '#60a5fa' :
                                       orbA.color === 'green' || orbB.color === 'green' ? '#4ade80' : '#a3a3a3'
                  spawnParticles(collisionX, collisionY, 6, particleColor, 1)
                }
              }
            }
          }
        }
        
        return newOrbs.map(orb => {
          // Skip if being dragged
          if (isDraggingRef.current === orb.id) return orb

          let { x, y, vx, vy, pulsePhase } = orb
          
          // Update pulse phase
          pulsePhase += 0.05 * deltaTime

          // Mouse interaction - repel from cursor
          const dx = x - mousePos.x
          const dy = y - mousePos.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 200 && dist > 0) {
            const force = ((200 - dist) / 200) * 2
            vx += (dx / dist) * force * deltaTime
            vy += (dy / dist) * force * deltaTime
          }

          // Gravity mode
          if (gravityMode) {
            vy += 0.5 * deltaTime
          } else {
            // Gentle drift back to base position (only when not in gravity mode)
            const driftStrength = 0.0005
            vx += (orb.baseX - x) * driftStrength * deltaTime
            vy += (orb.baseY - y) * driftStrength * deltaTime
          }

          // Apply friction
          const friction = gravityMode ? 0.995 : 0.99
          vx *= Math.pow(friction, deltaTime)
          vy *= Math.pow(friction, deltaTime)

          // Clamp max velocity
          const maxVel = 30
          const vel = Math.sqrt(vx * vx + vy * vy)
          if (vel > maxVel) {
            vx = (vx / vel) * maxVel
            vy = (vy / vel) * maxVel
          }

          // Update position
          x += vx * deltaTime
          y += vy * deltaTime

          // Bounce off edges with energy conservation
          const padding = orb.radius
          const bounciness = 0.8
          
          if (x < padding) { 
            x = padding
            vx = Math.abs(vx) * bounciness
          }
          if (x > window.innerWidth - padding) { 
            x = window.innerWidth - padding
            vx = -Math.abs(vx) * bounciness
          }
          if (y < padding) { 
            y = padding
            vy = Math.abs(vy) * bounciness
          }
          if (y > window.innerHeight - padding) { 
            y = window.innerHeight - padding
            vy = -Math.abs(vy) * bounciness
          }

          return { ...orb, x, y, vx, vy, pulsePhase }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mousePos, gravityMode, spawnParticles])

  // Handle orb drag start - bigger hit area!
  const handleOrbMouseDown = (e: React.MouseEvent, orbId: number) => {
    e.preventDefault()
    const orb = orbs.find(o => o.id === orbId)
    if (orb) {
      isDraggingRef.current = orbId
      dragOffsetRef.current = {
        x: e.clientX - orb.x,
        y: e.clientY - orb.y
      }
    }
  }

  // Get size class
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return styles.orbSmall
      case 'medium': return styles.orbMedium
      case 'large': return styles.orbLarge
      case 'xl': return styles.orbXL
      default: return styles.orbMedium
    }
  }

  // Get color class
  const getColorClass = (color: string) => {
    switch (color) {
      case 'primary': return styles.orbPrimary
      case 'yellow': return styles.orbYellow
      case 'gray': return styles.orbGray
      case 'red': return styles.orbRed
      case 'blue': return styles.orbBlue
      case 'green': return styles.orbGreen
      default: return styles.orbPrimary
    }
  }

  return (
    <div className={styles.loadingOverlay} ref={containerRef}>
      {/* Shockwave effect */}
      {shockwaveActive && (
        <div 
          className={styles.shockwave}
          style={{ left: shockwavePos.x, top: shockwavePos.y }}
        />
      )}

      {/* Mouse glow effect */}
      <div 
        className={styles.mouseGlow}
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Particles */}
      <div className={styles.particlesContainer}>
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: p.x,
              top: p.y,
              width: p.size * p.life,
              height: p.size * p.life,
              backgroundColor: p.color,
              opacity: p.life
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div className={styles.orbsContainer}>
        {orbs.map(orb => {
          const pulseScale = 1 + Math.sin(orb.pulsePhase) * 0.03
          const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy)
          const glowIntensity = Math.min(speed / 10, 1)
          
          return (
            <div
              key={orb.id}
              className={`${styles.orb} ${getSizeClass(orb.size)} ${getColorClass(orb.color)} ${isDraggingRef.current === orb.id ? styles.orbDragging : ''}`}
              style={{
                left: orb.x,
                top: orb.y,
                transform: `translate(-50%, -50%) scale(${pulseScale})`,
                boxShadow: speed > 5 ? `0 0 ${20 + glowIntensity * 30}px ${glowIntensity * 15}px rgba(254, 240, 138, ${glowIntensity * 0.5})` : undefined
              }}
              onMouseDown={(e) => handleOrbMouseDown(e, orb.id)}
            />
          )
        })}
      </div>

      {/* Content */}
      <div className={styles.loadingContent}>
        <h2 className={styles.loadingTitle}>{title}</h2>
        <p className={styles.loadingSubtitle}>{subtitle}</p>
        <div className={styles.typingIndicator}>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
          <span className={styles.typingDot}></span>
        </div>
      </div>

      {/* Mode indicators */}
      <div className={styles.modeIndicators}>
        {gravityMode && <span className={styles.modeTag}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}><circle cx="12" cy="12" r="10" fill="#3b82f6"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#60a5fa" strokeWidth="1.5"/><path d="M6 6C8 8 10 9 12 9C14 9 16 8 18 6" stroke="#22c55e" strokeWidth="2" fill="none"/><path d="M5 12C7 10 9 9 12 9C15 9 17 10 19 12" stroke="#22c55e" strokeWidth="2" fill="none"/><path d="M6 18C8 16 10 15 12 15C14 15 16 16 18 18" stroke="#22c55e" strokeWidth="2" fill="none"/></svg> Gravity ON</span>}
      </div>

      {/* Interactive hint */}
      <div className={styles.interactiveHint}>
        <p><svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}><path d="M12 2L13.09 8.26L19 7L14.74 10.91L19 17L13.09 14.74L12 22L10.91 14.74L5 17L9.26 10.91L5 7L10.91 8.26L12 2Z" fill="#fef08a" stroke="#fef08a" strokeWidth="1"/><path d="M19 2L19.5 4L21.5 4.5L19.5 5L19 7L18.5 5L16.5 4.5L18.5 4L19 2Z" fill="#fef08a"/><path d="M5 16L5.5 18L7.5 18.5L5.5 19L5 21L4.5 19L2.5 18.5L4.5 18L5 16Z" fill="#fef08a"/></svg> Drag orbs &amp; watch them collide!</p>
        <div className={styles.hotkeys}>
          <span><kbd>SPACE</kbd> Shockwave</span>
          <span><kbd>G</kbd> Gravity</span>
          <span><kbd>R</kbd> Reset</span>
        </div>
      </div>
    </div>
  )
}
