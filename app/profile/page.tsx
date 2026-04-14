'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import * as profileDb from '@/lib/profile-db'
import type { Profile } from '@/lib/profile-db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { AchievementCard } from '@/components/AchievementCard'
import { subscribePush, saveSubscription, getPermissionState } from '@/lib/push'
import { getUnseenCount } from '@/lib/sharing-db'

// ── Toggle switch ──────────────────────────────────────────
function Toggle({
  value, onChange, disabled,
}: {
  value: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onChange}
      style={{
        width: 46, height: 27, borderRadius: 14,
        backgroundColor: value ? 'var(--text-primary)' : 'var(--border)',
        border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 3,
        display: 'flex', alignItems: 'center', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
        opacity: disabled ? 0.45 : 1,
        transition: 'background-color 0.22s ease, opacity 0.22s ease',
      }}
    >
      <motion.div
        animate={{ x: value ? 19 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          width: 21, height: 21, borderRadius: '50%',
          backgroundColor: '#fff', flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
        }}
      />
    </motion.button>
  )
}

// ── Section wrapper ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        margin: '0 0 8px 4px', transition: 'color 0.25s ease',
      }}>
        {title}
      </p>
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: 18,
        border: '1px solid var(--border)', overflow: 'hidden',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Setting row ────────────────────────────────────────────
interface RowProps {
  iconBg:     string
  iconEl:     React.ReactNode
  label:      string
  sublabel?:  string
  value?:     string
  badge?:     string
  rightSlot?: React.ReactNode
  onPress?:   () => void
  isLast?:    boolean
  disabled?:  boolean
}
function SettingRow({ iconBg, iconEl, label, sublabel, value, badge, rightSlot, onPress, isLast, disabled }: RowProps) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', opacity: disabled ? 0.45 : 1 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        transition: 'background-color 0.25s ease',
      }}>
        {iconEl}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: sublabel ? '0 0 1px' : 0, transition: 'color 0.25s ease' }}>
          {label}
        </p>
        {sublabel && <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>{sublabel}</p>}
      </div>
      {badge ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 20, padding: '2px 8px', letterSpacing: '0.04em' }}>
          {badge}
        </span>
      ) : rightSlot ? rightSlot : value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}>{value}</span>
          {onPress && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" color="var(--text-secondary)"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
      ) : onPress ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" color="var(--text-secondary)"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : null}
    </div>
  )

  return (
    <div>
      {onPress && !disabled ? (
        <motion.button whileTap={{ backgroundColor: 'var(--surface2)' }} onClick={onPress}
          style={{ display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
          {inner}
        </motion.button>
      ) : inner}
      {!isLast && <div style={{ height: 1, backgroundColor: 'var(--border)', marginLeft: 66, transition: 'background-color 0.25s ease' }} />}
    </div>
  )
}

// ── Username availability status ──────────────────────────
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'same'

function validateUsername(u: string): string | null {
  if (u.length < 3)  return 'Au moins 3 caractères'
  if (u.length > 20) return '20 caractères maximum'
  if (!/^[a-z0-9_]+$/.test(u)) return 'Lettres, chiffres et _ uniquement'
  return null
}

// ── Notification button state ─────────────────────────────
type NotifState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

// ── Main page ─────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { user, stamps, collections, isDark, toggleDark } = useStore()

  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)
  const [notifState,  setNotifState]  = useState<NotifState>('idle')
  const [unseenCount, setUnseenCount] = useState(0)

  // ── Username editing ──────────────────────────────────
  const [editingUsername,  setEditingUsername]  = useState(false)
  const [usernameInput,    setUsernameInput]    = useState('')
  const [usernameStatus,   setUsernameStatus]   = useState<UsernameStatus>('idle')
  const [usernameHint,     setUsernameHint]     = useState<string | null>(null)
  const [savingUsername,   setSavingUsername]   = useState(false)
  const usernameDebounce   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usernameInputRef   = useRef<HTMLInputElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      profileDb.fetchProfile(user.id).then((p) => {
        setProfile(p)
        setAvatarUrl(p?.avatarUrl ?? null)
      })
      getUnseenCount(user.id).then(setUnseenCount)
    }
  }, [user])

  useEffect(() => {
    const state = getPermissionState()
    if (state === 'granted')     setNotifState('granted')
    if (state === 'denied')      setNotifState('denied')
    if (state === 'unsupported') setNotifState('unsupported')
  }, [])

  // ── Avatar upload ─────────────────────────────────────
  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click()
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const url = await profileDb.uploadAvatar(user.id, file)
    if (url) setAvatarUrl(`${url}?t=${Date.now()}`)  // cache-bust
    setUploading(false)
    e.target.value = ''  // allow re-selecting same file
  }

  // ── Username edit: open ───────────────────────────────
  const openUsernameEdit = () => {
    setUsernameInput(profile?.username ?? '')
    setUsernameStatus('same')
    setUsernameHint(null)
    setEditingUsername(true)
    setTimeout(() => usernameInputRef.current?.focus(), 80)
  }

  // ── Username edit: debounced check ────────────────────
  useEffect(() => {
    if (!editingUsername) return
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current)

    const trimmed = usernameInput.toLowerCase().trim()

    if (!trimmed) {
      setUsernameStatus('idle')
      setUsernameHint(null)
      return
    }
    if (trimmed === (profile?.username ?? '').toLowerCase()) {
      setUsernameStatus('same')
      setUsernameHint(null)
      return
    }
    const err = validateUsername(trimmed)
    if (err) {
      setUsernameStatus('invalid')
      setUsernameHint(err)
      return
    }
    setUsernameStatus('checking')
    setUsernameHint(null)
    usernameDebounce.current = setTimeout(async () => {
      const available = await profileDb.checkUsernameAvailable(trimmed)
      setUsernameStatus(available ? 'available' : 'taken')
      setUsernameHint(available ? null : 'Ce pseudo est déjà pris.')
    }, 450)
  }, [usernameInput, editingUsername]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Username edit: save ───────────────────────────────
  const saveUsername = async () => {
    if (!user) return
    const trimmed = usernameInput.toLowerCase().trim()
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking') return
    setSavingUsername(true)
    try {
      await profileDb.upsertProfile(user.id, { username: trimmed })
      setProfile((p) => p ? { ...p, username: trimmed } : p)
      setEditingUsername(false)
    } catch {
      setUsernameHint('Erreur lors de la sauvegarde, réessaie.')
    } finally {
      setSavingUsername(false)
    }
  }

  // ── Notifications ─────────────────────────────────────
  const handleNotifToggle = useCallback(async () => {
    if (notifState !== 'idle') return
    setNotifState('loading')
    const sub = await subscribePush()
    if (!sub) {
      setNotifState(Notification.permission === 'denied' ? 'denied' : 'idle')
      return
    }
    await saveSubscription(sub)
    setNotifState('granted')
  }, [notifState])

  const handleSignOut = async () => {
    await profileDb.signOut()
    router.push('/auth')
  }

  const displayName = profile?.fullName || profile?.username || user?.email?.split('@')[0] || 'Utilisateur'
  const initial     = displayName.charAt(0).toUpperCase()
  const streak      = profile?.streak ?? 0
  const userCols    = collections.filter((c) => c.id !== 'all')

  const unlockedIds = new Set(
    ACHIEVEMENTS.filter((a) => a.check(stamps, streak, userCols.length)).map((a) => a.id),
  )

  // Only first 3 badges shown on profile; rest on /profile/badges
  const previewBadges = ACHIEVEMENTS.slice(0, 3)

  const notifSublabel =
    notifState === 'denied'      ? 'Bloquées — modifie les réglages de l\'app' :
    notifState === 'unsupported' ? 'Non supporté sur cet appareil' :
    notifState === 'granted'     ? 'Rappel entre 11h et 21h activé ✓' :
    'Rappel quotidien entre 11h et 21h'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 48, transition: 'background-color 0.25s ease' }}>

      {/* ── Top bar ────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px', transition: 'color 0.25s ease' }}>
          Profil
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Avatar + name + stats ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 32px', gap: 14 }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarFile}
        />

        {/* Avatar — clickable (wrapper holds streak badge outside the circle clip) */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.06 }}
          style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}
        >
          {/* Circle */}
          <div
            onClick={handleAvatarClick}
            style={{
              width: 84, height: 84, borderRadius: '50%',
              backgroundColor: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
              transition: 'background-color 0.25s ease',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',   // kept here, streak badge is outside this div
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Photo de profil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--bg)', letterSpacing: '-1px', lineHeight: 1, transition: 'color 0.25s ease' }}>
                {initial}
              </span>
            )}

            {/* Hover / upload overlay */}
            <motion.div
              animate={{ opacity: uploading ? 1 : 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.42)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {uploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                  }}
                />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="13" r="3.5" />
                  <path d="M21 8.5h-2l-1.5-2.5h-11L5 8.5H3A1.5 1.5 0 0 0 1.5 10v10A1.5 1.5 0 0 0 3 21.5h18A1.5 1.5 0 0 0 22.5 20V10A1.5 1.5 0 0 0 21 8.5Z" />
                </svg>
              )}
            </motion.div>
          </div>

          {/* ── Streak flame badge — outside overflow:hidden ── */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.2 }}
              style={{
                position: 'absolute',
                bottom: -7,
                right: -7,
                background: 'linear-gradient(145deg, #FB923C 0%, #EF4444 100%)',
                borderRadius: 20,
                border: '2.5px solid var(--bg)',
                padding: '4px 9px 4px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 3px 14px rgba(239,68,68,0.45)',
              }}
            >
              {/* Flame SVG */}
              <svg width="9" height="12" viewBox="0 0 9 13" fill="none">
                <path
                  d="M4.5 0.5C4.5 0.5 1.5 4 1.5 8a3 3 0 0 0 6 0c0-2.2-1.4-3.8-1.4-5.2C6.1 2.8 5.6 5 4.2 6.2 4.2 4 4.5 0.5 4.5 0.5Z"
                  fill="white"
                />
              </svg>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: '#fff', lineHeight: 1,
                letterSpacing: '-0.3px',
              }}>
                {streak}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Name & email */}
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>

          {/* Display name + edit button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px', transition: 'color 0.25s ease' }}>
              {displayName}
            </h2>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={openUsernameEdit}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: 4, display: 'flex',
                WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}
              aria-label="Modifier le pseudo"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
              </svg>
            </motion.button>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
            {user?.email}
          </p>

          {/* Inline username editor */}
          <AnimatePresence>
            {editingUsername && (
              <motion.div
                key="username-editor"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.22 }}
                style={{ overflow: 'hidden', marginTop: 14 }}
              >
                {/* Input row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '0 12px',
                  transition: 'border-color 0.2s ease',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>@</span>
                  <input
                    ref={usernameInputRef}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditingUsername(false) }}
                    placeholder="ton_pseudo"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{
                      flex: 1, border: 'none', background: 'none', outline: 'none',
                      fontSize: 15, fontFamily: 'inherit', color: 'var(--text-primary)',
                      padding: '11px 0',
                    }}
                  />
                  {/* Status icon */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 18 }}>
                    {usernameStatus === 'checking' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                        </path>
                      </svg>
                    )}
                    {usernameStatus === 'available' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                    )}
                    {usernameStatus === 'taken' && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Hint text */}
                <AnimatePresence>
                  {usernameHint && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        fontSize: 12, margin: '5px 4px 0', textAlign: 'left',
                        color: usernameStatus === 'taken' ? '#EF4444' : 'var(--text-secondary)',
                      }}
                    >
                      {usernameHint}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingUsername(false)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={saveUsername}
                    disabled={savingUsername || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'invalid' || usernameStatus === 'idle'}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                      background: (savingUsername || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'invalid' || usernameStatus === 'idle')
                        ? 'var(--text-secondary)' : 'var(--text-primary)',
                      color: 'var(--bg)', fontSize: 14, fontWeight: 600,
                      cursor: (savingUsername || usernameStatus === 'taken' || usernameStatus === 'checking' || usernameStatus === 'invalid' || usernameStatus === 'idle')
                        ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', transition: 'background 0.2s',
                    }}
                  >
                    {savingUsername ? '…' : 'Enregistrer'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.36 }}
          style={{
            display: 'flex', backgroundColor: 'var(--surface)', borderRadius: 20,
            border: '1px solid var(--border)', overflow: 'hidden',
            width: '100%', maxWidth: 340, marginTop: 4,
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          }}
        >
          {[
            { value: stamps.length,    label: 'Stamps'      },
            { value: userCols.length,  label: 'Collections' },
            { value: streak,           label: 'Jours 🔥'    },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '16px 8px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              transition: 'border-color 0.25s ease',
            }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.5px', transition: 'color 0.25s ease' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'color 0.25s ease' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Sections ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.38 }}
        style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28 }}
      >

        {/* ── BADGES (preview — 3 max) ─────────────────── */}
        <div>
          {/* Header with "Voir plus" */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 10px 4px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0, transition: 'color 0.25s ease' }}>
              Badges — {unlockedIds.size}/{ACHIEVEMENTS.length}
            </p>
            <motion.button
              whileTap={{ opacity: 0.6 }}
              onClick={() => router.push('/profile/badges')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                fontFamily: 'inherit', padding: '2px 4px',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex', alignItems: 'center', gap: 3,
                transition: 'color 0.25s ease',
              }}
            >
              Voir plus
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {previewBadges.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.05 }}
                style={{ height: '100%' }}
              >
                <AchievementCard
                  id={a.id} label={a.label} desc={a.desc}
                  unlocked={unlockedIds.has(a.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── NOTIFICATIONS ─────────────────────────────── */}
        <Section title="Notifications">
          <SettingRow
            iconBg="var(--icon-red-bg)"
            iconEl={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-red)' }}>
                <path d="M9 2C6.24 2 4 4.24 4 7V11L2 13H16L14 11V7C14 4.24 11.76 2 9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7 13C7 14.1 7.9 15 9 15C10.1 15 11 14.1 11 13" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            }
            label="Stamp du jour"
            sublabel={notifSublabel}
            rightSlot={
              <Toggle
                value={notifState === 'granted'}
                onChange={handleNotifToggle}
                disabled={notifState === 'denied' || notifState === 'unsupported' || notifState === 'loading'}
              />
            }
            isLast
          />
        </Section>

        {/* ── APPARENCE ─────────────────────────────────── */}
        <Section title="Apparence">
          <SettingRow
            iconBg="var(--icon-theme-bg)"
            iconEl={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-theme)' }}>
                {isDark ? (
                  <path d="M14.5 10.5A6.5 6.5 0 0 1 7.5 3.5a6.5 6.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <>
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M4.1 13.9l1.1-1.1M12.8 5.2l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </>
                )}
              </svg>
            }
            label={isDark ? 'Mode sombre' : 'Mode clair'}
            rightSlot={<Toggle value={isDark} onChange={toggleDark} />}
            isLast
          />
        </Section>

        {/* ── DÉCOUVRIR ─────────────────────────────────── */}
        <Section title="Découvrir">
          <SettingRow
            iconBg="var(--icon-blue-bg)"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-blue)' }}><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 15C1.5 12.5 4 10.5 7 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M13.5 10.5V15.5M11 13H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
            label="Mes amis"
            sublabel="Suis tes amis et leurs stamps"
            onPress={() => router.push('/friends')}
          />
          <SettingRow
            iconBg="var(--icon-green-bg)"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-green)' }}><path d="M13 3L17 7L13 11V8.5C8 8.5 5 10.5 4 15C3.5 11 5 6 13 5.5V3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Stamps reçus"
            sublabel="Stamps partagés par tes amis"
            onPress={() => router.push('/friends/inbox')}
            rightSlot={unseenCount > 0 ? (
              <div style={{
                minWidth: 20, height: 20, borderRadius: 10,
                backgroundColor: '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 6px',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              </div>
            ) : undefined}
            isLast
          />
        </Section>

        {/* ── RETOURS ───────────────────────────────────── */}
        <Section title="Retours">
          <SettingRow
            iconBg="var(--icon-yellow-bg)"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-yellow)' }}><path d="M9 2L11 7H16.5L12 10.5L14 16L9 12.5L4 16L6 10.5L1.5 7H7L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Donner un avis" onPress={() => router.push('/profile/review')}
          />
          <SettingRow
            iconBg="var(--icon-purple-bg)"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ color: 'var(--icon-purple)' }}><path d="M2 3.5C2 2.67 2.67 2 3.5 2H14.5C15.33 2 16 2.67 16 3.5V11.5C16 12.33 15.33 13 14.5 13H10L6 16V13H3.5C2.67 13 2 12.33 2 11.5V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Support" onPress={() => router.push('/profile/support')} isLast
          />
        </Section>

        {/* ── DÉCONNEXION ───────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '15px', borderRadius: 18,
            backgroundColor: 'var(--surface)', border: '1.5px solid #FECACA',
            color: '#EF4444', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background-color 0.25s ease',
          }}
        >
          Se déconnecter
        </motion.button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
          Stamply v1.0
        </p>
      </motion.div>
    </div>
  )
}
