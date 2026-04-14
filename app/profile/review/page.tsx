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
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, marginTop: 16 }}
            >
              <div style={{
                width: 90, height: 110,
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="90" height="110" viewBox="0 0 90 110" fill="none"
                  style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path
                    d="M8 8 Q8 0 16 0 L74 0 Q82 0 82 8 L82 8
                       Q90 8 90 16 Q90 24 82 24 Q82 32 90 32 Q90 40 82 40
                       Q82 48 90 48 Q90 56 82 56 Q82 64 90 64 Q90 72 82 72
                       Q82 80 90 80 Q90 88 82 88 Q82 96 90 96 Q90 104 82 104
                       L82 102 Q82 110 74 110 L16 110 Q8 110 8 102
                       Q0 102 0 94 Q0 86 8 86 Q8 78 0 78 Q0 70 8 70
                       Q8 62 0 62 Q0 54 8 54 Q8 46 0 46 Q0 38 8 38
                       Q8 30 0 30 Q0 22 8 22 Q8 14 0 14 Q0 6 8 6 Z"
                    fill="var(--surface)"
                    stroke="var(--border)"
                    strokeWidth="1.5"
                  />
                </svg>
                <svg width="48" height="48" viewBox="0 0 100 100" fill="none"
                  stroke="var(--text-primary)" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M50 15 L60 38 L85 40 L67 57 L72 82 L50 70 L28 82 L33 57 L15 40 L40 38 Z" />
                </svg>
              </div>
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
