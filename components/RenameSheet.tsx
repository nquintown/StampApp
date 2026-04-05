'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface RenameSheetProps {
  visible:      boolean
  onClose:      () => void
  currentName:  string
  label:        string          // e.g. "stamp" or "collection"
  onConfirm:    (name: string) => void
}

export default function RenameSheet({
  visible, onClose, currentName, label, onConfirm,
}: RenameSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [value,   setValue]   = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Sync value when sheet opens with a (possibly different) currentName
  useEffect(() => {
    if (visible) {
      setValue(currentName)
      // Focus input after spring animation
      const t = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(t)
    }
  }, [visible, currentName])

  const handleConfirm = () => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === currentName) { onClose(); return }
    onConfirm(trimmed)
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 150 }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            style={{
              position: 'fixed', bottom: 0,
              left: 0, right: 0, margin: '0 auto',
              width: '100%', maxWidth: 430,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '0 0 max(28px, env(safe-area-inset-bottom, 28px))',
              zIndex: 160,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              transition: 'background-color 0.25s ease',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: 'var(--border)',
              margin: '14px auto 0',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px 14px',
              borderBottom: '1px solid var(--border)',
              transition: 'border-color 0.25s ease',
            }}>
              <p style={{
                fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                margin: 0, letterSpacing: '-0.2px',
                transition: 'color 0.25s ease',
              }}>
                Renommer {label === 'stamp' ? 'le stamp' : 'la collection'}
              </p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: 'var(--surface2)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.25s ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            {/* Input */}
            <div style={{ padding: '20px 20px 16px' }}>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
                placeholder={`Nom du ${label === 'stamp' ? 'stamp' : 'la collection'}`}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  fontSize: 16, color: 'var(--text-primary)',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease, background-color 0.25s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--text-primary)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  backgroundColor: 'var(--surface2)', border: 'none',
                  fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.25s ease',
                }}
              >
                Annuler
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={!value.trim() || value.trim() === currentName}
                style={{
                  flex: 1.6, padding: '14px', borderRadius: 14,
                  backgroundColor: (!value.trim() || value.trim() === currentName)
                    ? 'var(--surface2)'
                    : 'var(--text-primary)',
                  border: 'none',
                  fontSize: 15, fontWeight: 600,
                  color: (!value.trim() || value.trim() === currentName)
                    ? 'var(--text-secondary)'
                    : 'var(--bg)',
                  cursor: (!value.trim() || value.trim() === currentName) ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                }}
              >
                Enregistrer
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
