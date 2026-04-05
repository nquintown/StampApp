'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MenuItem {
  label: string
  icon?: React.ReactNode
  onPress?: () => void
  destructive?: boolean
  /** If true, the sheet won't auto-close when this item is pressed (the handler closes it manually) */
  noAutoClose?: boolean
}

interface ContextMenuSheetProps {
  visible: boolean
  onClose: () => void
  items: MenuItem[]
  title?: string
}

export default function ContextMenuSheet({
  visible,
  onClose,
  items,
  title,
}: ContextMenuSheetProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 150,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0, right: 0, margin: '0 auto',
              width: '100%',
              maxWidth: 430,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '16px 0 32px',
              zIndex: 160,
              boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
              transition: 'background-color 0.25s ease',
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--border)',
                margin: '0 auto 16px',
              }}
            />

            {title && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  marginBottom: 8,
                  padding: '0 20px',
                }}
              >
                {title}
              </p>
            )}

            {items.map((item, i) => (
              <motion.button
                key={i}
                whileTap={{ backgroundColor: 'var(--surface2)' }}
                onClick={() => {
                  item.onPress?.()
                  if (!item.noAutoClose) onClose()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '14px 24px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: i < items.length - 1 ? '1px solid var(--surface2)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {item.icon && (
                  <span style={{ color: item.destructive ? '#EF4444' : 'var(--text-primary)' }}>
                    {item.icon}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: item.destructive ? '#EF4444' : 'var(--text-primary)',
                  }}
                >
                  {item.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
