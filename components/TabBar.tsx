'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface TabBarProps {
  active: 'journal' | 'stamps'
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Calendar base */}
      <rect x="2.5" y="4" width="17" height="15" rx="2.5"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
      {/* Top pins */}
      <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4}
        strokeLinecap="round" />
      {/* Grid dots */}
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="11" cy="11" r="1" fill="currentColor" />
      <circle cx="14.5" cy="11" r="1" fill="currentColor" />
      <circle cx="7.5" cy="14.5" r="1" fill="currentColor" />
      <circle cx="11" cy="14.5" r="1" fill="currentColor" />
    </svg>
  )
}

function StampsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
      <rect x="12" y="3" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
      <rect x="3" y="12" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
      <rect x="12" y="12" width="7" height="7" rx="2"
        stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
    </svg>
  )
}

export default function TabBar({ active }: TabBarProps) {
  const router = useRouter()

  const tabs = [
    {
      key: 'journal' as const,
      label: 'Journal',
      icon: (a: boolean) => <JournalIcon active={a} />,
      href: '/journal',
    },
    {
      key: 'stamps' as const,
      label: 'Stamps',
      icon: (a: boolean) => <StampsIcon active={a} />,
      href: '/',
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        zIndex: 90,
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          height: 60,
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key
          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push(tab.href)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                WebkitTapHighlightColor: 'transparent',
                fontFamily: 'inherit',
                transition: 'color 0.2s ease',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
              }}>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      width: 32,
                      height: 2.5,
                      borderRadius: 2,
                      backgroundColor: 'var(--text-primary)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              {tab.icon(isActive)}
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
