'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'
import CollectionCard from '@/components/CollectionCard'
import StampCard from '@/components/StampCard'
import FAB from '@/components/FAB'
import TabBar from '@/components/TabBar'
import { preGrantGyroPermission } from '@/lib/gyro'
import { getPendingCount, getFriends, type FriendUser } from '@/lib/friends-db'
import { getReceivedShares, type SharedStampRecord } from '@/lib/sharing-db'
import { getJournalEntryForDate } from '@/lib/journal-db'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

// ── Sun icon (light mode indicator) ──────────────────────────
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M4.1 13.9l1.1-1.1M12.8 5.2l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Moon icon (dark mode indicator) ──────────────────────────
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M14.5 10.5A6.5 6.5 0 0 1 7.5 3.5a6.5 6.5 0 1 0 7 7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── User icon ─────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 15.5C2.5 12.5 5.4 10 9 10C12.6 10 15.5 12.5 15.5 15.5"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Friends story row ─────────────────────────────────────
function FriendAvatar({ friend, shareId, onClick }: {
  friend: FriendUser
  shareId: string | null
  onClick: () => void
}) {
  const name   = friend.username || friend.fullName || (friend.email ? friend.email.split('@')[0] : '?')
  const letter = name.charAt(0).toUpperCase()
  const hasNew = shareId !== null

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        WebkitTapHighlightColor: 'transparent', flexShrink: 0, width: 66,
      }}
    >
      {/* Avatar + badge wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Ring when has new stamp */}
        {hasNew && (
          <div style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
            zIndex: 0,
          }} />
        )}
        {/* Avatar circle */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 1,
          border: hasNew ? '2.5px solid var(--bg)' : '2px solid var(--border)',
          transition: 'border-color 0.25s ease',
          boxSizing: 'border-box',
        }}>
          {friend.avatarUrl ? (
            <img src={friend.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--bg)', lineHeight: 1 }}>
              {letter}
            </span>
          )}
        </div>
        {/* Mail badge */}
        {hasNew && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: '#3B82F6',
            border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m2 7 10 7 10-7"/>
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <span style={{
        fontSize: 11, fontWeight: hasNew ? 700 : 500,
        color: hasNew ? 'var(--text-primary)' : 'var(--text-secondary)',
        maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'color 0.25s ease',
      }}>
        {name}
      </span>
    </motion.button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { collections, stamps, isDark, loading, user } = useStore()
  const [pendingCount, setPendingCount] = useState(0)
  const [friends,      setFriends]      = useState<FriendUser[]>([])
  const [unseenMap,    setUnseenMap]    = useState<Map<string, string>>(new Map()) // senderId → shareId

  useEffect(() => {
    // Redirect new users to first-stamp experience
    const isNewUser = typeof window !== 'undefined' && localStorage.getItem('stamply_new_user')
    if (isNewUser) {
      localStorage.removeItem('stamply_new_user')
      router.replace('/first-stamp')
      return
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || loading) return
    const today = todayISO()
    const key = `stamply_daily_ok_${today}`
    if (localStorage.getItem(key)) return
    getJournalEntryForDate(user.id, today)
      .then((entry) => {
        if (entry) {
          localStorage.setItem(key, 'true')
        } else {
          router.replace('/daily-stamp')
        }
      })
      .catch(() => {
        // If check fails, don't redirect (fail silently)
        localStorage.setItem(key, 'true')
      })
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      getPendingCount(user.id).then(setPendingCount)

      // Load friends + unseen shares in parallel
      Promise.all([
        getFriends(user.id),
        getReceivedShares(user.id),
      ]).then(([friendList, shares]) => {
        setFriends(friendList)
        // Build map: senderId → most recent unseen shareId
        const map = new Map<string, string>()
        for (const s of shares) {
          if (!s.seen && !map.has(s.senderId)) {
            map.set(s.senderId, s.id)
          }
        }
        setUnseenMap(map)
      })
    }
  }, [user])

  // Group all stamps by month (most recent first)
  const stampsByMonth: { label: string; key: string; stamps: typeof stamps }[] = []
  const seen = new Map<string, typeof stamps>()
  for (const stamp of [...stamps].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )) {
    const d = new Date(stamp.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!seen.has(key)) { seen.set(key, []); stampsByMonth.push({ label, key, stamps: seen.get(key)! }) }
    seen.get(key)!.push(stamp)
  }

  const handleStampClick = async (id: string) => {
    await preGrantGyroPermission()
    router.push(`/stamps/${id}`)
  }

  // ── Loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 160 }}>
        <TopBar
          title="Stamply"
          leftSlot={<IconButton label="Nouvelle collection" onClick={() => {}}><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5C2 3.67 2.67 3 3.5 3H7.5L9 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg></IconButton>}
          rightSlot={<IconButton label="Profil" onClick={() => router.push('/profile')}><UserIcon /></IconButton>}
        />
        <div style={{ padding: '8px 20px 0' }}>
          {/* Skeleton pulses */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 13, width: 90, borderRadius: 6, backgroundColor: 'var(--surface2)', marginBottom: 14, animation: 'pulse 1.4s ease-in-out infinite' }} />
            {[0, 1].map((i) => (
              <div key={i} style={{ height: 88, borderRadius: 20, backgroundColor: 'var(--surface2)', marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div style={{ height: 13, width: 80, borderRadius: 6, backgroundColor: 'var(--surface2)', marginBottom: 20, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 16, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
        <TabBar active="stamps" />
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        paddingBottom: 160,
        transition: 'background-color 0.25s ease',
      }}
    >
      <TopBar
        title="Stamply"
        leftSlot={
          <IconButton
            label="Nouvelle collection"
            onClick={() => router.push('/collections/new')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 4.5C2 3.67 2.67 3 3.5 3H7.5L9 5H14.5C15.33 5 16 5.67 16 6.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9 8.5V11.5M7.5 10H10.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        }
        rightSlot={
          <div style={{ position: 'relative' }}>
            <IconButton label="Profil" onClick={() => router.push('/profile')}>
              <UserIcon />
            </IconButton>
            {pendingCount > 0 && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 10, height: 10, borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '1.5px solid var(--bg)',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        }
      />

      <div style={{ padding: '8px 0 0' }}>

        {/* ── Friends row ───────────────────────────────── */}
        {friends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: 28 }}
          >
            <div style={{ padding: '0 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
                letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
              }}>
                Amis
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}
                onClick={() => router.push('/friends')}
              >
                Voir tous
              </motion.button>
            </div>
            <div style={{
              display: 'flex', gap: 16, overflowX: 'auto',
              paddingLeft: 20, paddingRight: 20,
              paddingTop: 6, paddingBottom: 10,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}>
              <style>{`.friends-row::-webkit-scrollbar { display: none }`}</style>
              {friends.map((friend) => {
                const shareId = unseenMap.get(friend.userId) ?? null
                return (
                  <FriendAvatar
                    key={friend.userId}
                    friend={friend}
                    shareId={shareId}
                    onClick={() => {
                      if (shareId) router.push(`/friends/inbox/${shareId}`)
                      else router.push('/friends/inbox')
                    }}
                  />
                )
              })}
            </div>
          </motion.div>
        )}

      <div style={{ padding: '0 20px' }}>
        {/* Collections section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ marginBottom: 24 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Collections
            </h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                fontFamily: 'inherit',
              }}
              onClick={() => router.push('/grid')}
            >
              Voir tout
            </motion.button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {collections.filter((c) => c.id !== 'all').length === 0 ? (
              /* ── Empty state: no collections yet ── */
              <motion.div variants={itemVariants}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/collections/new')}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    borderRadius: 20,
                    padding: '20px 18px',
                    border: '1.5px dashed var(--border)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'border-color 0.25s ease, opacity 0.2s ease',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    backgroundColor: 'var(--surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--text-secondary)',
                    transition: 'background-color 0.25s ease',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M2 6C2 4.9 2.9 4 4 4H8.5L10.5 6.5H16C17.1 6.5 18 7.4 18 8.5V15C18 16.1 17.1 17 16 17H4C2.9 17 2 16.1 2 15V6Z"
                        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
                      />
                      <path d="M10 10.5V13.5M8.5 12H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 2px',
                      letterSpacing: '-0.2px',
                      transition: 'color 0.25s ease',
                    }}>
                      Créer une collection
                    </p>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      margin: 0,
                      transition: 'color 0.25s ease',
                    }}>
                      Organise tes stamps par thème
                    </p>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: 'var(--surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                    transition: 'background-color 0.25s ease',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              collections.filter((c) => c.id !== 'all').map((collection) => (
                <motion.div key={collection.id} variants={itemVariants}>
                  <CollectionCard
                    collection={collection}
                    stamps={stamps}
                    onClick={() => router.push(`/collections/${collection.id}`)}
                    onStampClick={async (id) => { await preGrantGyroPermission(); router.push(`/stamps/${id}`) }}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* All Stamps — grouped by month */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              Tous les Stamps
            </h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}
              onClick={() => router.push('/grid')}
            >
              Voir tout
            </motion.button>
          </div>

          {/* Month groups — max 3 months */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {stampsByMonth.slice(0, 3).map(({ label, key, stamps: monthStamps }, groupIdx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + groupIdx * 0.06, duration: 0.38 }}
              >
                {/* Month label */}
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                  {label}
                </p>

                {/* Stamps grid */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
                >
                  {monthStamps.map((stamp) => (
                    <motion.div key={stamp.id} variants={itemVariants} style={{ display: 'flex', justifyContent: 'center' }}>
                      <StampCard
                        stamp={stamp}
                        size="small"
                        onClick={() => handleStampClick(stamp.id)}
                        layoutId={`stamp-card-${stamp.id}`}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </div>

      <TabBar active="stamps" />

      <FAB
        onCamera={() => router.push('/camera')}
        onGallery={() => router.push('/create')}
      />
    </div>
  )
}
