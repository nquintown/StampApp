'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { IconButton } from '@/components/TopBar'

const SUBJECTS = [
  'Problème technique',
  'Mon compte',
  'Supprimer mon compte',
  'Suggestion d\'amélioration',
  'Autre',
]

export default function SupportPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)

  const canSend = subject.trim().length > 0 && message.trim().length > 0

  function handleSend() {
    if (!canSend) return
    const body = encodeURIComponent(message.trim())
    const sub = encodeURIComponent(`[Stamply Support] ${subject}`)
    window.location.href = `mailto:quintown.n@gmail.com?subject=${sub}&body=${body}`
    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
      paddingBottom: 48,
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{
          fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.2px', transition: 'color 0.25s ease',
        }}>
          Support
        </span>
        <div style={{ width: 36 }} />
      </div>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '8px 20px 0' }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              style={{ marginBottom: 32, marginTop: 8 }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="var(--text-primary)" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{
                margin: 0, fontSize: 22, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.4px',
              }}>
                Comment peut-on t&apos;aider ?
              </h2>
              <p style={{
                margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}>
                Décris ton problème ou ta question, nous te répondrons par email dans les plus brefs délais.
              </p>
            </motion.div>

            {/* Subject selector */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              style={{ marginBottom: 16, position: 'relative' }}
            >
              <label style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                Sujet
              </label>
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => setSubjectOpen(!subjectOpen)}
                style={{
                  width: '100%', padding: '14px 16px',
                  borderRadius: 14,
                  border: `1.5px solid ${subjectOpen ? 'var(--text-primary)' : 'var(--border)'}`,
                  background: 'var(--surface)',
                  color: subject ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 15, fontFamily: 'inherit',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  boxSizing: 'border-box',
                }}
              >
                <span>{subject || 'Choisir un sujet…'}</span>
                <motion.svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  animate={{ rotate: subjectOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </motion.button>

              <AnimatePresence>
                {subjectOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 6px)',
                      left: 0, right: 0, zIndex: 10,
                      background: 'var(--surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      transformOrigin: 'top',
                    }}
                  >
                    {SUBJECTS.map((s, i) => (
                      <motion.button
                        key={s}
                        whileTap={{ backgroundColor: 'var(--surface2)' }}
                        onClick={() => { setSubject(s); setSubjectOpen(false) }}
                        style={{
                          width: '100%', padding: '13px 16px',
                          background: subject === s ? 'var(--surface2)' : 'transparent',
                          border: 'none',
                          borderBottom: i < SUBJECTS.length - 1 ? '1px solid var(--border)' : 'none',
                          color: 'var(--text-primary)',
                          fontSize: 15, fontFamily: 'inherit',
                          cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {s}
                        {subject === s && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L7 12L13 5" stroke="var(--text-primary)"
                              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ marginBottom: 24 }}
            >
              <label style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décris ton problème en détail…"
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: 15, fontFamily: 'inherit',
                  outline: 'none', resize: 'none',
                  lineHeight: 1.6,
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
              <p style={{
                margin: '8px 0 0',
                fontSize: 12, color: 'var(--text-secondary)',
              }}>
                Envoyé à quintown.n@gmail.com via ton application mail.
              </p>
            </motion.div>

            {/* Send button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: '100%', padding: '16px',
                borderRadius: 16, border: 'none',
                background: canSend ? 'var(--text-primary)' : 'var(--border)',
                color: canSend ? 'var(--bg)' : 'var(--text-secondary)',
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                cursor: canSend ? 'pointer' : 'default',
                transition: 'background 0.22s ease, color 0.22s ease',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Envoyer le message
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              padding: '48px 20px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', gap: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 7" stroke="var(--text-primary)"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.4px',
            }}>
              Message envoyé !
            </h2>
            <p style={{
              margin: 0, fontSize: 15, color: 'var(--text-secondary)',
              lineHeight: 1.6, maxWidth: 280,
            }}>
              Nous avons bien reçu ta demande et te répondrons dans les plus brefs délais.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.back()}
              style={{
                marginTop: 16, padding: '14px 32px',
                borderRadius: 16, border: 'none',
                background: 'var(--text-primary)',
                color: 'var(--bg)',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retour au profil
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
