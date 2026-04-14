'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { IconButton } from '@/components/TopBar'

export default function ReviewPage() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const displayRating = hovered || rating

  const labels: Record<number, string> = {
    1: 'Décevant',
    2: 'Passable',
    3: 'Bien',
    4: 'Très bien',
    5: 'Excellent !',
  }

  function handleSubmit() {
    if (rating === 0) return
    setSubmitted(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
      paddingBottom: 48,
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{
          fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.2px', transition: 'color 0.25s ease',
        }}>
          Donner un avis
        </span>
        <div style={{ width: 36 }} />
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '8px 20px 0' }}
          >
            {/* Stamp illustration */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, marginTop: 8 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="180" height="216">
                <defs>
                  <style>{`
                    .stamp-container {
                      transform-origin: 250px 300px;
                      animation: jerkySwing 7s step-end infinite;
                    }
                    @keyframes jerkySwing {
                      0%      { transform: rotate(-3deg); }
                      14.28%  { transform: rotate(3deg); }
                      42.85%  { transform: rotate(-3deg); }
                      85.71%  { transform: rotate(3deg); }
                      100%    { transform: rotate(-3deg); }
                    }
                    .draw {
                      fill: none;
                      stroke: black;
                      stroke-width: 14;
                      stroke-linecap: round;
                      stroke-linejoin: round;
                      stroke-dasharray: 100;
                      stroke-dashoffset: 100;
                    }
                    @keyframes drawInOut {
                      0%   { stroke-dashoffset: 100; }
                      15%  { stroke-dashoffset: 0; }
                      85%  { stroke-dashoffset: 0; }
                      100% { stroke-dashoffset: 100; }
                    }
                    @keyframes bubbleFloat {
                      0%   { transform: rotate(-4deg); }
                      50%  { transform: rotate(4deg); }
                      100% { transform: rotate(-4deg); }
                    }
                    .bubble-draw { animation: drawInOut 10s ease-in-out infinite 0s; }
                    .star-draw   { animation: drawInOut 10s ease-in-out infinite 0.5s; }
                    .pop-draw    { animation: drawInOut 10s ease-in-out infinite 1s; }
                    .bubble-container {
                      transform-origin: 180px 420px;
                      animation: bubbleFloat 4s ease-in-out infinite;
                    }
                  `}</style>
                </defs>
                <g className="stamp-container">
                  <g fill="white" stroke="black" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 100,100 Q 125,65 150,100 Q 175,65 200,100 Q 225,65 250,100 Q 275,65 300,100 Q 325,65 350,100 Q 375,65 400,100 Q 435,125 400,150 Q 435,175 400,200 Q 435,225 400,250 Q 435,275 400,300 Q 435,325 400,350 Q 435,375 400,400 Q 435,425 400,450 Q 435,475 400,500 Q 375,535 350,500 Q 325,535 300,500 Q 275,535 250,500 Q 225,535 200,500 Q 175,535 150,500 Q 125,535 100,500 Q 65,475 100,450 Q 65,425 100,400 Q 65,375 100,350 Q 65,325 100,300 Q 65,275 100,250 Q 65,225 100,200 Q 65,175 100,150 Q 65,125 100,100 Z" />
                    <path d="M 130,135 Q 250,145 375,145 Q 365,300 360,470 Q 240,465 125,455 Q 125,300 130,135 Z" strokeWidth="14" />
                  </g>
                  <g className="bubble-container">
                    <path className="draw pop-draw" pathLength="100" d="M 150,190 L 170,210 M 250,150 L 250,180 M 350,190 L 330,210" />
                    <path className="draw bubble-draw" pathLength="100" d="M 180, 240 Q 180, 210 210, 210 L 290, 210 Q 320, 210 320, 240 L 320, 330 Q 320, 360 290, 360 L 220, 360 L 180, 410 L 200, 360 Q 180, 360 180, 330 Z" />
                    <path className="draw star-draw" pathLength="100" d="M 250,235 L 260,265 L 290,265 L 265,285 L 275,315 L 250,300 L 225,315 L 235,285 L 210,265 L 240,265 Z" />
                  </g>
                </g>
              </svg>
            </motion.div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{
                margin: 0, fontSize: 22, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.4px',
              }}>
                Tu apprécies Stamply ?
              </h2>
              <p style={{
                margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                Ton avis nous aide à améliorer l&apos;application.
              </p>
            </div>

            {/* Stars */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12,
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 4, WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <motion.svg
                    width="38" height="38" viewBox="0 0 24 24" fill="none"
                    animate={{ scale: displayRating >= star ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <path
                      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                      fill={displayRating >= star ? 'var(--text-primary)' : 'transparent'}
                      stroke={displayRating >= star ? 'var(--text-primary)' : 'var(--border)'}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </motion.button>
              ))}
            </div>

            {/* Label */}
            <div style={{ textAlign: 'center', height: 22, marginBottom: 28 }}>
              <AnimatePresence mode="wait">
                {displayRating > 0 && (
                  <motion.span
                    key={displayRating}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      fontSize: 14, fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {labels[displayRating]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Comment textarea */}
            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ marginBottom: 24, overflow: 'hidden' }}
                >
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    display: 'block', marginBottom: 8,
                  }}>
                    Un commentaire ? (facultatif)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partage ton expérience…"
                    rows={4}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1.5px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 15, fontFamily: 'inherit',
                      outline: 'none', resize: 'none',
                      lineHeight: 1.5,
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={rating === 0}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: 'none',
                background: rating > 0 ? 'var(--text-primary)' : 'var(--border)',
                color: rating > 0 ? 'var(--bg)' : 'var(--text-secondary)',
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                cursor: rating > 0 ? 'pointer' : 'default',
                transition: 'background 0.22s ease, color 0.22s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Envoyer mon avis
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              padding: '48px 20px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', gap: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 7" stroke="var(--text-primary)"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.4px',
            }}>
              Merci !
            </h2>
            <p style={{
              margin: 0, fontSize: 15, color: 'var(--text-secondary)',
              lineHeight: 1.6, maxWidth: 280,
            }}>
              Ton avis compte beaucoup pour nous. Il nous aide à rendre Stamply encore meilleure.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.back()}
              style={{
                marginTop: 16,
                padding: '14px 32px',
                borderRadius: 16, border: 'none',
                background: 'var(--text-primary)',
                color: 'var(--bg)',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retour au profil
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
