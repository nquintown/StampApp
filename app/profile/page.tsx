'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import * as profileDb from '@/lib/profile-db'
import type { Profile } from '@/lib/profile-db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { subscribePush, saveSubscription, getPermissionState } from '@/lib/push'

// ── Toggle switch ──────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <motion.button
      onClick={onChange}
      style={{
        width: 46, height: 27, borderRadius: 14,
        backgroundColor: value ? 'var(--text-primary)' : 'var(--border)',
        border: 'none', cursor: 'pointer', padding: 3,
        display: 'flex', alignItems: 'center', flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
        transition: 'background-color 0.22s ease',
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

// ── Achievement card ───────────────────────────────────────
function AchievementCard({ emoji, label, desc, unlocked }: { emoji: string; label: string; desc: string; unlocked: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        backgroundColor: 'var(--surface)',
        border: `1.5px solid ${unlocked ? 'var(--text-primary)' : 'var(--border)'}`,
        borderRadius: 18,
        padding: '16px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        textAlign: 'center',
        opacity: unlocked ? 1 : 0.42,
        transition: 'background-color 0.25s ease, border-color 0.25s ease, opacity 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {unlocked && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
      )}
      <span style={{ fontSize: 28, lineHeight: 1 }}>{unlocked ? emoji : '🔒'}</span>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', transition: 'color 0.25s ease' }}>
          {label}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3, transition: 'color 0.25s ease' }}>
          {desc}
        </p>
      </div>
    </motion.div>
  )
}

// ── Notification button states ────────────────────────────
type NotifState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

// ── Main page ─────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { user, stamps, collections, isDark, toggleDark } = useStore()

  const [profile,     setProfile]     = useState<Profile | null>(null)
  const [notifState,  setNotifState]  = useState<NotifState>('idle')

  useEffect(() => {
    if (user) profileDb.fetchProfile(user.id).then(setProfile)
  }, [user])

  // Check current notification permission on mount
  useEffect(() => {
    const state = getPermissionState()
    if (state === 'granted')     setNotifState('granted')
    if (state === 'denied')      setNotifState('denied')
    if (state === 'unsupported') setNotifState('unsupported')
  }, [])

  const handleNotifToggle = useCallback(async () => {
    if (notifState === 'granted' || notifState === 'denied') return
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

  // Compute achievements
  const unlockedIds = new Set(
    ACHIEVEMENTS.filter((a) => a.check(stamps, streak, userCols.length)).map((a) => a.id),
  )

  // Notification button label
  const notifLabel =
    notifState === 'loading'     ? 'Activation…'           :
    notifState === 'granted'     ? '✓ Activées'            :
    notifState === 'denied'      ? 'Bloquées (navigateur)' :
    notifState === 'unsupported' ? 'Non supporté'          :
    'Activer les notifications'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 48, transition: 'background-color 0.25s ease' }}>

      {/* ── Top bar ──────────────────────────────────────── */}
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

      {/* ── Avatar + name + stats ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 32px', gap: 14 }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.06 }}
          style={{
            width: 84, height: 84, borderRadius: '50%',
            backgroundColor: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
            transition: 'background-color 0.25s ease',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--bg)', letterSpacing: '-1px', lineHeight: 1, transition: 'color 0.25s ease' }}>
            {initial}
          </span>
          {/* Streak badge */}
          {streak > 0 && (
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              backgroundColor: '#F97316', borderRadius: 12,
              padding: '2px 7px', border: '2px solid var(--bg)',
              fontSize: 12, fontWeight: 800, color: '#fff',
              lineHeight: 1.4,
            }}>
              {streak}🔥
            </div>
          )}
        </motion.div>

        {/* Name & email */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px', transition: 'color 0.25s ease' }}>
            {displayName}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
            {user?.email}
          </p>
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
            { value: stamps.length, label: 'Stamps' },
            { value: userCols.length, label: 'Collections' },
            { value: streak, label: 'Jours 🔥' },
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

      {/* ── Sections ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.38 }}
        style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        {/* ACHIEVEMENTS */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px 4px', transition: 'color 0.25s ease' }}>
            Badges — {unlockedIds.size}/{ACHIEVEMENTS.length}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.04 }}>
                <AchievementCard
                  emoji={a.emoji} label={a.label} desc={a.desc}
                  unlocked={unlockedIds.has(a.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          <SettingRow
            iconBg="#FFE4E4"
            iconEl={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="#EF4444">
                <path d="M9 2C6.24 2 4 4.24 4 7V11L2 13H16L14 11V7C14 4.24 11.76 2 9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7 13C7 14.1 7.9 15 9 15C10.1 15 11 14.1 11 13" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            }
            label="Stamp du jour"
            sublabel="Rappel quotidien à 11h"
            rightSlot={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNotifToggle}
                disabled={notifState === 'loading' || notifState === 'granted' || notifState === 'denied' || notifState === 'unsupported'}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: notifState === 'granted' ? '#10B981' : notifState === 'denied' ? '#EF4444' : 'var(--bg)',
                  backgroundColor: notifState === 'granted' ? '#D1FAE5' : notifState === 'denied' ? '#FFE4E4' : 'var(--text-primary)',
                  border: 'none', borderRadius: 10, padding: '6px 12px',
                  cursor: notifState === 'idle' ? 'pointer' : 'default',
                  fontFamily: 'inherit', flexShrink: 0,
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {notifLabel}
              </motion.button>
            }
            isLast
          />
        </Section>

        {/* APPARENCE */}
        <Section title="Apparence">
          <SettingRow
            iconBg={isDark ? '#1A1A2E' : '#FFF8E1'}
            iconEl={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" color={isDark ? '#818CF8' : '#F59E0B'}>
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

        {/* DÉCOUVRIR */}
        <Section title="Découvrir">
          <SettingRow
            iconBg="#DBEAFE"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="#3B82F6"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 15C1.5 12.5 4 10.5 7 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M13.5 10.5V15.5M11 13H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>}
            label="Mes amis" sublabel="Suis tes amis et leurs stamps"
            badge="Bientôt" disabled
          />
          <SettingRow
            iconBg="#D1FAE5"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="#10B981"><path d="M13 3L17 7L13 11V8.5C8 8.5 5 10.5 4 15C3.5 11 5 6 13 5.5V3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Partager un stamp" sublabel="Envoie un stamp à un ami"
            badge="Bientôt" disabled isLast
          />
        </Section>

        {/* RETOURS */}
        <Section title="Retours">
          <SettingRow
            iconBg="#FEF3C7"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="#F59E0B"><path d="M9 2L11 7H16.5L12 10.5L14 16L9 12.5L4 16L6 10.5L1.5 7H7L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Donner un avis" onPress={() => {}}
          />
          <SettingRow
            iconBg="#EDE9FE"
            iconEl={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="#8B5CF6"><path d="M2 3.5C2 2.67 2.67 2 3.5 2H14.5C15.33 2 16 2.67 16 3.5V11.5C16 12.33 15.33 13 14.5 13H10L6 16V13H3.5C2.67 13 2 12.33 2 11.5V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
            label="Support" onPress={() => {}} isLast
          />
        </Section>

        {/* DÉCONNEXION */}
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
          Stampverse v1.0
        </p>
      </motion.div>
    </div>
  )
}
