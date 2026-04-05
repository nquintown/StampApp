'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import * as profileDb from '@/lib/profile-db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { AchievementCard } from '@/components/AchievementCard'

export default function BadgesPage() {
  const router  = useRouter()
  const { user, stamps, collections } = useStore()

  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (user) {
      profileDb.fetchProfile(user.id).then((p) => {
        setStreak(p?.streak ?? 0)
      })
    }
  }, [user])

  const userCols    = collections.filter((c) => c.id !== 'all')
  const unlockedIds = new Set(
    ACHIEVEMENTS.filter((a) => a.check(stamps, streak, userCols.length)).map((a) => a.id),
  )

  const unlockedCount = unlockedIds.size

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
          Badges
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Subtitle ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        style={{ padding: '4px 20px 24px', textAlign: 'center' }}
      >
        {/* Progress bar */}
        <div style={{
          height: 6, backgroundColor: 'var(--border)', borderRadius: 3,
          overflow: 'hidden', marginBottom: 10,
          transition: 'background-color 0.25s ease',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: 'var(--text-primary)', borderRadius: 3 }}
          />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{unlockedCount}</span> badge{unlockedCount > 1 ? 's' : ''} débloqué{unlockedCount > 1 ? 's' : ''} sur {ACHIEVEMENTS.length}
        </p>
      </motion.div>

      {/* ── Grid ───────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ACHIEVEMENTS.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
            >
              <AchievementCard
                id={a.id}
                label={a.label}
                desc={a.desc}
                unlocked={unlockedIds.has(a.id)}
                animate={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
