'use client'

import React, { useEffect, useState, use } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import { fetchProfile, type Profile } from '@/lib/profile-db'
import { fetchFriendPublicStats, fetchCommonCollections, type RawCollection } from '@/lib/stamps-db'
import { getSharedStampsBetweenUsers, type SharedStampRecord } from '@/lib/sharing-db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { AchievementCard } from '@/components/AchievementCard'
import type { Stamp } from '@/lib/types'

// ── Stat card ─────────────────────────────────────────────
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{
      flex: 1, backgroundColor: 'var(--surface)', borderRadius: 16,
      border: '1px solid var(--border)', padding: '14px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        {value}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
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
      {/* Direction badge */}
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

// ── Section title ─────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <h3 style={{
      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      margin: '0 0 12px',
    }}>
      {title}
    </h3>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function FriendProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router  = useRouter()
  const me      = useStore((s) => s.user)

  const [profile,        setProfile]        = useState<Profile | null>(null)
  const [stats,          setStats]          = useState<{ stampCount: number; collectionCount: number } | null>(null)
  const [sharedStamps,   setSharedStamps]   = useState<SharedStampRecord[]>([])
  const [commonCols,     setCommonCols]     = useState<RawCollection[]>([])
  const [loading,        setLoading]        = useState(true)

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

  // Compute unlocked badges using fake stamps array (count-based)
  const fakeStamps = Array.from(
    { length: stats?.stampCount ?? 0 },
    () => ({ id: '', collectionId: '' } as Stamp),
  )
  const unlockedIds = new Set(
    ACHIEVEMENTS
      .filter((a) => a.check(fakeStamps, profile?.streak ?? 0, stats?.collectionCount ?? 0))
      .map((a) => a.id),
  )

  const displayName = profile?.fullName || profile?.username || '…'
  const initial     = displayName.charAt(0).toUpperCase()

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
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          {profile?.username ? `@${profile.username}` : displayName}
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {[80, 120, 60].map((w, i) => (
            <div key={i} style={{ height: 16, width: w, borderRadius: 8, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ padding: '8px 20px 0' }}
        >
          {/* ── Avatar + name ─────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, gap: 10 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              backgroundColor: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', border: '3px solid var(--surface)',
              boxShadow: '0 0 0 1.5px var(--border)',
            }}>
              {profile?.avatarUrl
                ? <img src={profile.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--bg)' }}>{initial}</span>
              }
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                {profile?.fullName || profile?.username || ''}
              </p>
              {profile?.username && profile?.fullName && (
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {/* ── Stats cards ───────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <StatCard value={stats?.stampCount ?? 0} label="Stamps" />
            <StatCard value={stats?.collectionCount ?? 0} label="Collections" />
            <StatCard value={`${profile?.streak ?? 0} 🔥`} label="Jours" />
          </div>

          {/* ── Badges ────────────────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={`Badges — ${unlockedIds.size}/${ACHIEVEMENTS.length}`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACHIEVEMENTS.map((a) => (
                <AchievementCard
                  key={a.id}
                  id={a.id}
                  label={a.label}
                  desc={a.desc}
                  unlocked={unlockedIds.has(a.id)}
                  animate={false}
                />
              ))}
            </div>
          </div>

          {/* ── Stamps partagés ───────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle title={`Stamps partagés — ${sharedStamps.length}`} />
            {sharedStamps.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--surface)', borderRadius: 16,
                border: '1px solid var(--border)', padding: '28px 20px',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Aucun stamp partagé pour l&apos;instant.{'\n'}Envoie un stamp à cet ami !
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {sharedStamps.map((share) => (
                  <SharedStampThumb
                    key={share.id}
                    share={share}
                    isMe={share.senderId === me?.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Collections communes ──────────────────── */}
          {commonCols.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <SectionTitle title={`Collections communes — ${commonCols.length}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {commonCols.map((col) => (
                  <div
                    key={col.id}
                    style={{
                      backgroundColor: 'var(--surface)', borderRadius: 14,
                      border: '1px solid var(--border)',
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 11,
                      backgroundColor: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 4.5C2 3.67 2.67 3 3.5 3H7.5L9 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
                          stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {col.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
