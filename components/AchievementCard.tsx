'use client'

import { motion } from 'framer-motion'

// ── Badge icon per achievement ID ─────────────────────────
export function BadgeIcon({ id }: { id: string }) {
  const p = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.65,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (id) {
    case 'first_stamp':
      return (
        <svg {...p}>
          <circle cx="12" cy="12.5" r="3.2" />
          <path d="M20.5 8H18l-1.5-2.5h-9L6 8H3.5A1.5 1.5 0 0 0 2 9.5v9A1.5 1.5 0 0 0 3.5 20h17A1.5 1.5 0 0 0 22 18.5v-9A1.5 1.5 0 0 0 20.5 8Z" />
        </svg>
      )
    case 'five_stamps':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'twenty_stamps':
      return (
        <svg {...p}>
          <path d="M12 2c0 5.5-5.5 8.5-5.5 13.5a5.5 5.5 0 0 0 11 0C17.5 10.5 12 7.5 12 2Z" />
          <path d="M12 12.5c0 2.5-1.5 3.5-1.5 5a1.5 1.5 0 0 0 3 0c0-1.5-1.5-2.5-1.5-5Z" />
        </svg>
      )
    case 'fifty_stamps':
      return (
        <svg {...p}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    case 'streak_3':
      return (
        <svg {...p}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )
    case 'streak_7':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M9 16l2 2 4-4" />
        </svg>
      )
    case 'streak_30':
      return (
        <svg {...p}>
          <path d="M6.5 3h11l4 6-9.5 12L2.5 9l4-6z" />
          <path d="M2.5 9h19M6.5 3l5.5 6 5.5-6" />
        </svg>
      )
    case 'first_collection':
      return (
        <svg {...p}>
          <path d="M12 2 2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    case 'tag_master':
      return (
        <svg {...p}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return <svg {...p}><circle cx="12" cy="12" r="7" /></svg>
  }
}

// ── Stamp-shaped achievement card ─────────────────────────
// CSS mask with radial-gradient perforations on all 4 edges
export function AchievementCard({
  id, label, desc, unlocked, animate = true,
}: {
  id: string
  label: string
  desc: string
  unlocked: boolean
  animate?: boolean
}) {
  const R = 5       // perforation hole radius (px)
  const G = 14      // perforation tile spacing
  const E = R * 2   // edge strip = 10px

  const stampMask = [
    `radial-gradient(circle at 50% 0,    transparent ${R}px, #000 ${R}px) top    left / ${G}px ${E}px repeat-x`,
    `radial-gradient(circle at 50% 100%, transparent ${R}px, #000 ${R}px) bottom left / ${G}px ${E}px repeat-x`,
    `radial-gradient(circle at 0   50%, transparent ${R}px, #000 ${R}px) top    left / ${E}px ${G}px repeat-y`,
    `radial-gradient(circle at 100% 50%, transparent ${R}px, #000 ${R}px) top   right / ${E}px ${G}px repeat-y`,
    `linear-gradient(#000, #000) ${E}px ${E}px / calc(100% - ${E * 2}px) calc(100% - ${E * 2}px) no-repeat`,
  ].join(', ')

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.82 } : false}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        WebkitMask: stampMask,
        mask: stampMask,
        backgroundColor: 'var(--surface)',
        padding: `${E + 14}px 8px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        textAlign: 'center',
        filter: unlocked ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))' : 'grayscale(1)',
        opacity: unlocked ? 1 : 0.36,
        transition: 'opacity 0.3s ease, filter 0.3s ease, background-color 0.25s ease',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        backgroundColor: unlocked ? 'var(--text-primary)' : 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: unlocked ? 'var(--bg)' : 'var(--text-secondary)',
        transition: 'background-color 0.25s ease',
      }}>
        <BadgeIcon id={id} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-primary)',
          margin: 0, lineHeight: 1.25, transition: 'color 0.25s ease',
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 10, color: 'var(--text-secondary)',
          margin: 0, lineHeight: 1.3, transition: 'color 0.25s ease',
        }}>
          {desc}
        </p>
      </div>
    </motion.div>
  )
}
