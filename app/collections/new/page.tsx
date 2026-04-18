'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'
import { getFriends, type FriendUser } from '@/lib/friends-db'

export default function NewCollectionPage() {
  const router = useRouter()
  const user          = useStore((s) => s.user)
  const addCollection = useStore((s) => s.addCollection)

  const [step,     setStep]     = useState<1 | 2>(1)
  const [name,     setName]     = useState('')
  const [friends,  setFriends]  = useState<FriendUser[]>([])
  const [invited,  setInvited]  = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) getFriends(user.id).then(setFriends)
  }, [user])

  const handleCreate = () => {
    if (!name.trim()) return
    addCollection(name.trim(), Array.from(invited))
    router.back()
  }

  const toggleInvite = (id: string) =>
    setInvited((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <TopBar
        title={step === 1 ? 'Nouvelle collection' : 'Inviter des amis'}
        leftSlot={
          <IconButton label="Retour" onClick={() => step === 2 ? setStep(1) : router.back()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        }
      />

      <AnimatePresence mode="wait">

        {/* ── Step 1: Name ─────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            style={{ padding: '40px 24px 32px' }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              style={{
                width: 64, height: 64, borderRadius: 18,
                backgroundColor: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 28,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M3 7.5C3 6.12 4.12 5 5.5 5H11L13 7.5H22.5C23.88 7.5 25 8.62 25 10V21C25 22.38 23.88 23.5 22.5 23.5H5.5C4.12 23.5 3 22.38 3 21V7.5Z"
                  stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M14 12.5V18.5M11 15.5H17" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </motion.div>

            {/* Name input */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}>
              <label style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'block', marginBottom: 10,
              }}>
                Nom de la collection
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                placeholder="ex. Voyage, Nature, Amis…"
                maxLength={40}
                style={{
                  width: '100%', fontSize: 20, fontWeight: 600,
                  color: 'var(--text-primary)', backgroundColor: 'var(--surface2)',
                  border: '1.5px solid var(--border)', borderRadius: 14,
                  outline: 'none', padding: '14px 16px', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
                Donne un nom à ta collection pour commencer.
              </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.35 }}
              style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Next: invite friends */}
              {friends.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    backgroundColor: name.trim() ? 'var(--text-primary)' : 'var(--surface2)',
                    color: name.trim() ? 'var(--bg)' : 'var(--text-secondary)',
                    fontSize: 16, fontWeight: 600, border: 'none',
                    cursor: name.trim() ? 'pointer' : 'default',
                    transition: 'background-color 0.2s, color 0.2s',
                    fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <circle cx="7" cy="6" r="2.8" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M1.5 16c0-3 2.6-5 5.5-5M13 9v6M10 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Inviter des amis
                </motion.button>
              )}

              {/* Create without inviting */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCreate}
                disabled={!name.trim()}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  backgroundColor: friends.length > 0 ? 'transparent' : (name.trim() ? 'var(--text-primary)' : 'var(--surface2)'),
                  color: friends.length > 0 ? 'var(--text-secondary)' : (name.trim() ? 'var(--bg)' : 'var(--text-secondary)'),
                  border: friends.length > 0 ? '1.5px solid var(--border)' : 'none',
                  fontSize: 15, fontWeight: 600,
                  cursor: name.trim() ? 'pointer' : 'default',
                  transition: 'background-color 0.2s, color 0.2s',
                  fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {friends.length > 0 ? 'Créer sans inviter' : 'Créer la collection'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ── Step 2: Invite friends ────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22 }}
            style={{ padding: '24px 0 120px' }}
          >
            <p style={{
              fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55,
              padding: '0 24px', marginBottom: 20,
            }}>
              Tes amis invités pourront ajouter des stamps à cette collection.
            </p>

            {/* Friends list */}
            <div style={{
              margin: '0 20px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              overflow: 'hidden',
            }}>
              {friends.map((fr, i) => {
                const name2 = fr.username || fr.fullName || fr.email?.split('@')[0] || '?'
                const letter = name2.charAt(0).toUpperCase()
                const isInvited = invited.has(fr.userId)

                return (
                  <motion.button
                    key={fr.userId}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleInvite(fr.userId)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 12, padding: '13px 16px',
                      background: 'none',
                      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                      borderBottom: i < friends.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', textAlign: 'left',
                      WebkitTapHighlightColor: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden',
                    }}>
                      {fr.avatarUrl
                        ? <img src={fr.avatarUrl} alt={name2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--bg)' }}>{letter}</span>
                      }
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{name2}</p>
                      {fr.username && fr.fullName && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>@{fr.username}</p>
                      )}
                    </div>

                    {/* Check circle */}
                    <motion.div
                      animate={{
                        backgroundColor: isInvited ? 'var(--text-primary)' : 'var(--surface2)',
                        borderColor: isInvited ? 'var(--text-primary)' : 'var(--border)',
                      }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: '1.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isInvited && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>

            {/* Create button */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '12px 20px', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))', backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)', boxSizing: 'border-box' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCreate}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
                  fontSize: 16, fontWeight: 600, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.25s ease',
                }}
              >
                {invited.size > 0
                  ? `Créer et inviter ${invited.size} ami${invited.size > 1 ? 's' : ''}`
                  : 'Créer la collection'
                }
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
