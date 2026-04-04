'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ProcessingOverlayProps {
  visible: boolean
  message?: string
}

export default function ProcessingOverlay({
  visible,
  message = 'Processing stamp...',
}: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(247,244,237,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 200,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid #E7E1D5',
              borderTopColor: '#1E1E1C',
            }}
          />
          <p
            style={{
              fontSize: 14,
              color: '#6B6B67',
              fontWeight: 500,
            }}
          >
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
