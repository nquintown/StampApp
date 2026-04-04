'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface TopBarProps {
  title?: string
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  transparent?: boolean
}

export default function TopBar({
  title,
  leftSlot,
  rightSlot,
  transparent = false,
}: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        backgroundColor: transparent ? 'transparent' : 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Left slot */}
      <div style={{ minWidth: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
        {leftSlot}
      </div>

      {/* Title */}
      {title && (
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            margin: 0,
            flex: 1,
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
      )}

      {/* Right slot */}
      <div
        style={{
          minWidth: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {rightSlot}
      </div>
    </motion.header>
  )
}

// Icon button helper
export function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick?: () => void
  label?: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'var(--surface2)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {children}
    </motion.button>
  )
}
