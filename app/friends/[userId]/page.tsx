'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import { fetchProfile, type Profile } from '@/lib/profile-db'
import { fetchFriendPublicStats, fetchCommonCollections, type RawCollection } from '@/lib/stamps-db'
import { getSharedStampsBetweenUsers, type SharedStampRecord } from '@/lib/sharing-db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { AchievementCard } from '@/components/AchievementCard'
import type { Stamp } from '@/lib/types'

// ── User icon (no photo fallback) ─────────────────────────
function UserIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="9" cy="6.5" r="2.8" />
      <path d="M2.5 15.5C2.5 12.5 5.4 10 9 10C12.6 10 15.5 12.5 15.5 15.5" />
    </svg>
  )
}

// ── Section title ─────────────────────────────────────────
function SectionTitle({ title, rightSlot }: { title: string; rightSlot?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 10px 4px' }}>
      <p style={{
        fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
        letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
        transition: 'color 0.25s ease',
      }}>
        {title}
      </p>
      {rightSlot}
    </div>
  )
}

// ── Shared stamp thumbnail ────────────────────────────────
function SharedStampThumb({ share, isMe }: { share: SharedStampRecord; isMe: boolean }) {
  return (
    <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', backgroundColor: 'var(--surface2)' }}>
      {share.stampThumbnailUrl
        ? <img src={share.stampThumbnailUrl} alt={share.stampTitle ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: share.stampDominantColor ?? 'var(--surface2)' }} />
      }
      <div style={{
        position: 'absolute', top: 6, right: 6,
        width: 22, height: 22, borderRadius: '50%',
        backgroundColor: isMe ? 'var(--text-primary)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          {isMe
            ? <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M2 22L13 11M2 22L9 2L13 11M2 22L22 15L13 11" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          }
        </svg>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function FriendProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const router = useRouter()
  const me     = useStore((s) => s.user)

  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [stats,        setStats]        = useState<{ stampCount: number; collectionCount: number } | null>(null)
  const [sharedStamps, setSharedStamps] = useState<SharedStampRecord[]>([])
  const [commonCols,   setCommonCols]   = useState<RawCollection[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showAllBadges, setShowAllBadges] = useState(false)

  useEffect(() => {
    if (!me || !userId) return
    Promise.all([
      fetchProfile(userId),
      fetchFriendPublicStats(userId),
      getSharedStampsBetweenUsers(me.id, userId),
      fetchCommonCollections(me.id, userId),
    ]).then(([prof, st, shares, cols]) => {
      setProfile(prof)
      setStats(st)
      setSharedStamps(shares)
      setCommonCols(cols)
      setLoading(false)
    })
  }, [me, userId])

  // Count-based badge unlocking
  const fakeStamps = Array.from(
    { length: stats?.stampCount ?? 0 },
    () => ({ id: '', collectionId: '' } as Stamp),
  )
  const unlockedIds = new Set(
    ACHIEVEMENTS
      .filter((a) => a.check(fakeStamps, profile?.streak ?? 0, stats?.collectionCount ?? 0))
      .map((a) => a.id),
  )

  const streak      = profile?.streak ?? 0
  const displayName = profile?.fullName || profile?.username || '…'
  const previewBadges = showAllBadges ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 60, transition: 'background-color 0.25s ease' }}>

      {/* Top bar */}
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
          {profile?.username ? `@${profile.username}` : displayName}
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        /* ── Skeleton ──────────────────────────────────── */
        <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 18, width: 120, borderRadius: 8, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 80, width: '100%', maxWidth: 340, borderRadius: 20, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Avatar + name + stats ─────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 32px', gap: 14 }}>

            {/* Avatar with streak badge */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.06 }}
              style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}
            >
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
                overflow: 'hidden',
                transition: 'background-color 0.25s ease',
              }}>
                {profile?.avatarUrl
                  ? <img src={profile.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <UserIcon size={34} />
                }
              </div>

              {/* Streak badge */}
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.2 }}
                  style={{
                    position: 'absolute', bottom: -7, right: -7,
                    background: 'linear-gradient(145deg, #FB923C 0%, #EF4444 100%)',
                    borderRadius: 20, border: '2.5px solid var(--bg)',
                    padding: '4px 9px 4px 7px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 3px 14px rgba(239,68,68,0.45)',
                  }}
                >
                  <svg width="9" height="12" viewBox="0 0 9 13" fill="none">
                    <path d="M4.5 0.5C4.5 0.5 1.5 4 1.5 8a3 3 0 0 0 6 0c0-2.2-1.4-3.8-1.4-5.2C6.1 2.8 5.6 5 4.2 6.2 4.2 4 4.5 0.5 4.5 0.5Z" fill="white" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.3px' }}>
                    {streak}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Name */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px', transition: 'color 0.25s ease' }}>
                {displayName}
              </h2>
              {profile?.username && profile?.fullName && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Unified stats card */}
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
                { value: stats?.stampCount ?? 0,      label: 'Stamps'      },
                { value: stats?.collectionCount ?? 0,  label: 'Collections' },
                { value: streak,                       label: 'Jours 🔥'    },
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
          </div>

          {/* ── Sections ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.38 }}
            style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 32 }}
          >

            {/* ── Badges ────────────────────────────────────── */}
            <div>
              <SectionTitle
                title={`Badges — ${unlockedIds.size}/${ACHIEVEMENTS.length}`}
                rightSlot={
                  <motion.button
                    whileTap={{ opacity: 0.6 }}
                    onClick={() => setShowAllBadges((v) => !v)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                      fontFamily: 'inherit', padding: '2px 4px',
                      WebkitTapHighlightColor: 'transparent',
                      display: 'flex', alignItems: 'center', gap: 3,
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {showAllBadges ? 'Voir moins' : 'Voir plus'}
                    <motion.svg
                      width="13" height="13" viewBox="0 0 14 14" fill="none"
                      animate={{ rotate: showAllBadges ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </motion.button>
                }
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <AnimatePresence initial={false}>
                  {previewBadges.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i < 3 ? 0.28 + i * 0.05 : (i - 3) * 0.04 }}
                      style={{ height: '100%' }}
                    >
                      <AchievementCard
                        id={a.id} label={a.label} desc={a.desc}
                        unlocked={unlockedIds.has(a.id)}
                        animate={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Stamps partagés ───────────────────────────── */}
            {sharedStamps.length > 0 && (
              <div>
                <SectionTitle title={`Stamps partagés — ${sharedStamps.length}`} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {sharedStamps.map((share) => (
                    <SharedStampThumb
                      key={share.id}
                      share={share}
                      isMe={share.senderId === me?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {sharedStamps.length === 0 && (
              <div>
                <SectionTitle title="Stamps partagés — 0" />
                <div style={{
                  backgroundColor: 'var(--surface)', borderRadius: 16,
                  border: '1px solid var(--border)', padding: '24px 20px',
                  textAlign: 'center',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Aucun stamp partagé pour l&apos;instant.
                  </p>
                </div>
              </div>
            )}

            {/* ── Collections communes ──────────────────────── */}
            {commonCols.length > 0 && (
              <div>
                <SectionTitle title={`Collections communes — ${commonCols.length}`} />
                <div style={{
                  backgroundColor: 'var(--surface)', borderRadius: 18,
                  border: '1px solid var(--border)', overflow: 'hidden',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}>
                  {commonCols.map((col, i) => (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        borderBottom: i < commonCols.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'border-color 0.25s ease',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: 'var(--surface2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'background-color 0.25s ease',
                      }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M2 4.5C2 3.67 2.67 3 3.5 3H7.5L9 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
                            stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', transition: 'color 0.25s ease' }}>
                        {col.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
