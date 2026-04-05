'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

export default function Toast() {
  const dbError   = useStore((s) => s.dbError)
  const clearError = useStore((s) => s.clearError)

  // Auto-dismiss after 6 s
  useEffect(() => {
    if (!dbError) return
    const t = setTimeout(clearError, 6000)
    return () => clearTimeout(t)
  }, [dbError, clearError])

  return (
    <AnimatePresence>
      {dbError && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 60, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
            left: 16,
            right: 16,
            zIndex: 9999,
            backgroundColor: '#1C1C1E',
            borderRadius: 18,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          {/* Red dot */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: '#EF4444', flexShrink: 0, marginTop: 4,
          }} />

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.1px' }}>
              Erreur de sauvegarde
            </p>
            <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.4 }}>
              {dbError}
            </p>
          </div>

          <button
            onClick={clearError}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: 15, padding: '2px 8px',
              borderRadius: 8, fontFamily: 'inherit', lineHeight: 1.4, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
