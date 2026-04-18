'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FABProps {
  onCamera?: () => void
  onCollection?: () => void
}

export default function FAB({ onCamera, onCollection }: FABProps) {
  const [open, setOpen] = useState(false)

  // Close menu on outside tap
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const bottom = 'calc(60px + max(28px, env(safe-area-inset-bottom, 28px)))'

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 98,
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Action items */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: `calc(${bottom} + 68px)`,
              right: 16,
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              alignItems: 'flex-end',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Créer une collection */}
            <ActionItem
              label="Créer une collection"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4.5C2 3.67 2.67 3 3.5 3H7.5L9 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
                    stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <path d="M9 8V12M7 10H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
              onClick={() => { setOpen(false); onCollection?.() }}
            />

            {/* Prendre une photo */}
            <ActionItem
              label="Prendre une photo"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 6.5C2 5.67 2.67 5 3.5 5H4.5L6 3H12L13.5 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V6.5Z"
                    stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="9" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              }
              onClick={() => { setOpen(false); onCamera?.() }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: open ? 45 : 0 }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 25, delay: open ? 0 : 0.3 },
          opacity: { delay: open ? 0 : 0.3, duration: 0.2 },
          rotate: { type: 'spring', stiffness: 400, damping: 28 },
        }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        aria-label="Actions"
        style={{
          position: 'fixed',
          bottom,
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
          <path d="M11 4V18M4 11H18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </motion.button>
    </>
  )
}

function ActionItem({
  label, icon, onClick,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '10px 16px 10px 12px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        WebkitTapHighlightColor: 'transparent',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </motion.button>
  )
}
