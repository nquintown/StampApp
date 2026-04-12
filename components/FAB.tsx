'use client'

import { motion } from 'framer-motion'

interface FABProps {
  onCamera?: () => void
}

export default function FAB({ onCamera }: FABProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 25, delay: 0.3 },
        opacity: { delay: 0.3, duration: 0.2 },
      }}
      whileTap={{ scale: 0.9 }}
      onClick={onCamera}
      aria-label="Prendre une photo"
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
  )
}
