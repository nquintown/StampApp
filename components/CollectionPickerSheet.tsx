'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Collection } from '@/lib/types'

interface CollectionPickerSheetProps {
  visible: boolean
  onClose: () => void
  collections: Collection[]
  currentCollectionId: string
  onSelect: (collectionId: string) => void
}

export default function CollectionPickerSheet({
  visible,
  onClose,
  collections,
  currentCollectionId,
  onSelect,
}: CollectionPickerSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleSelect = (id: string) => {
    onSelect(id)
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
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 150,
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0, right: 0, margin: '0 auto',
              width: '100%',
              maxWidth: 430,
              backgroundColor: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
              zIndex: 160,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
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
              padding: '16px 24px 12px',
              borderBottom: '1px solid var(--surface2)',
            }}>
              <p style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: 0,
              }}>
                Move to Collection
              </p>
            </div>

            {/* Collection list */}
            <div style={{ padding: '8px 0' }}>
              {collections.map((col, i) => {
                const isActive = col.id === currentCollectionId
                return (
                  <motion.button
                    key={col.id}
                    whileTap={{ backgroundColor: 'var(--surface2)' }}
                    onClick={() => handleSelect(col.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '14px 24px',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < collections.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Collection icon */}
                      <div style={{
                        width: 40, height: 40,
                        borderRadius: 12,
                        backgroundColor: isActive ? 'var(--text-primary)' : 'var(--surface2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.2s',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path
                            d="M2 5.5C2 4.67 2.67 4 3.5 4H7L8.5 6H14.5C15.33 6 16 6.67 16 7.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V5.5Z"
                            stroke={isActive ? 'var(--bg)' : 'var(--text-secondary)'}
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      {/* Name + count */}
                      <div>
                        <p style={{
                          fontSize: 16,
                          fontWeight: isActive ? 600 : 500,
                          color: 'var(--text-primary)',
                          margin: 0,
                          letterSpacing: '-0.1px',
                        }}>
                          {col.name}
                        </p>
                        <p style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          margin: '1px 0 0',
                        }}>
                          {col.stampCount} {col.stampCount === 1 ? 'stamp' : 'stamps'}
                        </p>
                      </div>
                    </div>

                    {/* Checkmark for current */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                          style={{
                            width: 24, height: 24,
                            borderRadius: 12,
                            backgroundColor: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="var(--bg)"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
