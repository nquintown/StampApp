'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FABProps {
  onCamera?: () => void
  onGallery?: () => void
}

export default function FAB({ onCamera, onGallery }: FABProps) {
  const [open, setOpen] = useState(false)

  const handleMain = () => {
    if (onCamera && onGallery) {
      setOpen((v) => !v)
    } else {
      onCamera?.()
    }
  }

  const handleOption = (fn?: () => void) => {
    setOpen(false)
    setTimeout(() => fn?.(), 80)
  }

  return (
    <>
      {/* Backdrop to close menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 98,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sub-actions */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 'calc(60px + max(88px, calc(env(safe-area-inset-bottom, 0px) + 88px)))',
              right: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 10,
              zIndex: 99,
            }}
          >
            {/* Gallery option */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handleOption(onGallery)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '10px 18px 10px 14px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
                WebkitTapHighlightColor: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'var(--surface2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.25s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="3.5" width="13" height="10" rx="2"
                    stroke="currentColor" strokeWidth="1.4" />
                  <path d="M1.5 10.5L5 7.5L7.5 10L10.5 7L14.5 11"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="5" cy="6" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Depuis la galerie</span>
            </motion.button>

            {/* Camera option */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handleOption(onCamera)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                padding: '10px 18px 10px 14px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
                WebkitTapHighlightColor: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.25s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="4" width="13" height="9.5" rx="2"
                    stroke="var(--bg)" strokeWidth="1.4" />
                  <circle cx="8" cy="8.5" r="2.2"
                    stroke="var(--bg)" strokeWidth="1.4" />
                  <path d="M5.5 4L6.5 2.5H9.5L10.5 4"
                    stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Prendre une photo</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: open ? 45 : 0,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 25, delay: 0.3 },
          opacity: { delay: 0.3, duration: 0.2 },
          rotate: { type: 'spring', stiffness: 320, damping: 22 },
        }}
        whileTap={{ scale: 0.9 }}
        onClick={handleMain}
        aria-label="Add stamp"
        style={{
          position: 'fixed',
          bottom: 'calc(60px + max(28px, env(safe-area-inset-bottom, 28px)))',
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'var(--text-primary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.18)',
          zIndex: 100,
          WebkitTapHighlightColor: 'transparent',
          color: 'var(--bg)',
          transition: 'background-color 0.25s ease',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 4V18M4 11H18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </motion.button>
    </>
  )
}
