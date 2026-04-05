'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getFriends, type FriendUser } from '@/lib/friends-db'
import { shareStamp } from '@/lib/sharing-db'

interface Props {
  visible:  boolean
  onClose:  () => void
  stamp: {
    id:             string
    title:          string
    thumbnailUrl:   string
    imageUrl:       string
    dominantColor?: string
    createdAt?:     string
    location?:      string | null
    tags?:          string[] | null
  }
  userId: string
}

// ── Avatar helper ─────────────────────────────────────────
function Avatar({ user, size = 40 }: { user: FriendUser; size?: number }) {
  const name   = user.username || user.fullName || '?'
  const letter = name.charAt(0).toUpperCase()

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: 'var(--text-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: 'var(--bg)', fontSize: size * 0.38, fontWeight: 700, lineHeight: 1,
      transition: 'background-color 0.25s ease',
    }}>
      {letter}
    </div>
  )
}

export default function FriendPickerSheet({ visible, onClose, stamp, userId }: Props) {
  const [mounted,    setMounted]    = useState(false)
  const [friends,    setFriends]    = useState<FriendUser[]>([])
  const [loading,    setLoading]    = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sending,    setSending]    = useState(false)
  const [sent,       setSent]       = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!visible) {
      // Reset on close
      setTimeout(() => { setSelectedId(null); setSent(false); setSending(false) }, 350)
      return
    }
    setLoading(true)
    getFriends(userId).then((f) => { setFriends(f); setLoading(false) })
  }, [visible, userId])

  const handleSend = async () => {
    if (!selectedId || sending) return
    setSending(true)
    await shareStamp(userId, selectedId, stamp)
    setSent(true)
    setSending(false)
    setTimeout(() => onClose(), 1200)
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
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 150,
            }}
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
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              zIndex: 160,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
              maxHeight: '80vh',
              transition: 'background-color 0.25s ease',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: 'var(--border)',
              margin: '14px auto 0', flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px 12px', flexShrink: 0,
              borderBottom: '1px solid var(--border)',
              transition: 'border-color 0.25s ease',
            }}>
              <p style={{
                fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                margin: 0, letterSpacing: '-0.2px',
                transition: 'color 0.25s ease',
              }}>
                Envoyer à un ami
              </p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: 'var(--surface2)',
                  border: 'none', cursor: 'pointer',
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

            {/* Stamp preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              transition: 'border-color 0.25s ease',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                backgroundColor: stamp.dominantColor ?? 'var(--surface2)', flexShrink: 0,
              }}>
                <img
                  src={stamp.thumbnailUrl}
                  alt={stamp.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', transition: 'color 0.25s ease' }}>
                  {stamp.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
                  Stamp partagé
                </p>
              </div>
            </div>

            {/* Friend list — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {loading ? (
                /* Skeleton */
                <div style={{ padding: '8px 0' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        backgroundColor: 'var(--surface2)',
                        animation: 'pulse 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.1}s`,
                        flexShrink: 0,
                      }} />
                      <div style={{ height: 14, flex: 1, borderRadius: 7, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                /* Empty state */
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '40px 24px', gap: 8,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    backgroundColor: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2 20c0-3.5 3.1-6 7-6M16 11v6M13 14h6" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, textAlign: 'center', transition: 'color 0.25s ease' }}>
                    Aucun ami pour l'instant
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, textAlign: 'center', transition: 'color 0.25s ease' }}>
                    Ajoute des amis depuis l'onglet Amis
                  </p>
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {friends.map((f, i) => {
                    const isSelected = selectedId === f.userId
                    const name = f.username || f.fullName || 'Utilisateur'
                    return (
                      <motion.button
                        key={f.userId}
                        whileTap={{ backgroundColor: 'var(--surface2)' }}
                        onClick={() => setSelectedId(isSelected ? null : f.userId)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '12px 20px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: i < friends.length - 1 ? '1px solid var(--border)' : 'none',
                          WebkitTapHighlightColor: 'transparent',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar user={f} />
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
                              {name}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '1px 0 0', transition: 'color 0.25s ease' }}>
                              {f.stampCount} stamp{f.stampCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Radio circle */}
                        <motion.div
                          animate={{
                            backgroundColor: isSelected ? 'var(--text-primary)' : 'transparent',
                            borderColor: isSelected ? 'var(--text-primary)' : 'var(--border)',
                          }}
                          transition={{ duration: 0.15 }}
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            border: '2px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Send button */}
            {friends.length > 0 && (
              <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={!selectedId || sending || sent}
                  style={{
                    width: '100%', padding: '15px',
                    borderRadius: 16, border: 'none',
                    backgroundColor: sent
                      ? '#10B981'
                      : (!selectedId || sending)
                      ? 'var(--surface2)'
                      : 'var(--text-primary)',
                    color: sent
                      ? '#fff'
                      : (!selectedId || sending)
                      ? 'var(--text-secondary)'
                      : 'var(--bg)',
                    fontSize: 15, fontWeight: 600,
                    cursor: (!selectedId || sending || sent) ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {sent ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8L6 12L14 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Envoyé !
                    </>
                  ) : sending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderTopColor: 'var(--text-primary)',
                      }}
                    />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 2L9 13.5L7 9L2.5 7L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      Envoyer
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
