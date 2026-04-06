'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'

export default function NewCollectionPage() {
  const router = useRouter()
  const addCollection = useStore((s) => s.addCollection)
  const [name, setName] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    addCollection(name.trim())
    router.back()
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <TopBar
        title="Nouvelle collection"
        leftSlot={
          <IconButton label="Retour" onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 14L6 9L11 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
        }
      />

      <div style={{ padding: '40px 24px 32px' }}>
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M3 7.5C3 6.12 4.12 5 5.5 5H11L13 7.5H22.5C23.88 7.5 25 8.62 25 10V21C25 22.38 23.88 23.5 22.5 23.5H5.5C4.12 23.5 3 22.38 3 21V7.5Z"
              stroke="var(--text-secondary)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M14 12.5V18.5M11 15.5H17"
              stroke="var(--text-secondary)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Name input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 10,
            }}
          >
            Nom de la collection
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="ex. Voyage, Nature, Amis…"
            maxLength={40}
            style={{
              width: '100%',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface2)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              outline: 'none',
              padding: '14px 16px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-primary)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          />
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Donne un nom à ta collection pour commencer.
          </p>
        </motion.div>

        {/* Create button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          style={{ marginTop: 36 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              backgroundColor: name.trim() ? 'var(--text-primary)' : 'var(--surface2)',
              color: name.trim() ? 'var(--bg)' : 'var(--text-secondary)',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              cursor: name.trim() ? 'pointer' : 'default',
              transition: 'background-color 0.2s, color 0.2s',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Créer la collection
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
