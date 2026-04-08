'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Stamp photos for background decoration ─────────────────
const DECO_STAMPS = [
  { id: 0, size: 108, left: '62%',  top: '4%',   img: 'https://picsum.photos/seed/stamp1/300/300',  delay: 0,    dur: 9  },
  { id: 1, size: 72,  left: '-4%',  top: '14%',  img: 'https://picsum.photos/seed/stamp3/300/300',  delay: 0.1,  dur: 11 },
  { id: 2, size: 88,  left: '78%',  top: '28%',  img: 'https://picsum.photos/seed/stamp5/300/300',  delay: 0.05, dur: 10 },
  { id: 3, size: 64,  left: '4%',   top: '38%',  img: 'https://picsum.photos/seed/stamp7/300/300',  delay: 0.15, dur: 13 },
  { id: 4, size: 80,  left: '55%',  top: '40%',  img: 'https://picsum.photos/seed/stamp9/300/300',  delay: 0.08, dur: 8  },
]

const FLOAT_PATHS = [
  { x: [0, 10, -6, 8, 0],  y: [0, -16, 8, -12, 0]  },
  { x: [0, -8, 12, -5, 0], y: [0, -10, 6, -14, 0]  },
  { x: [0, 12, -8, 6, 0],  y: [0, -18, 10, -8, 0]  },
  { x: [0, -6, 10, -8, 0], y: [0, -8, 14, -10, 0]  },
  { x: [0, 8, -10, 6, 0],  y: [0, -12, 6, -16, 0]  },
]

// ── Icons ──────────────────────────────────────────────────
function StampIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="var(--text-primary)" />
      <path
        d="M14 20a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V20Z"
        fill="none" stroke="var(--bg)" strokeWidth="1.5"
      />
      <path
        d="M12 20h2M12 24h2M12 28h2M12 32h2M12 36h2M42 20h2M42 24h2M42 28h2M42 32h2M42 36h2M20 12v2M24 12v2M28 12v2M32 12v2M36 12v2M20 42v2M24 42v2M28 42v2M32 42v2M36 42v2"
        stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="5" fill="var(--bg)" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M12.627 1c.05.518-.14 1.04-.43 1.43-.3.4-.77.72-1.27.68-.06-.5.15-1.02.43-1.4.29-.39.79-.7 1.27-.71Zm2.04 4.01c-.28.17-2.56 1.47-2.53 4.14.03 2.77 2.44 3.77 2.5 3.8-.02.08-.38 1.3-1.27 2.54-.77 1.1-1.58 2.18-2.81 2.2-1.21.02-1.6-.72-2.98-.72-1.39 0-1.82.7-2.97.74-1.19.04-2.1-1.18-2.87-2.27C.24 13.72-.79 10.55.73 8.36c.76-1.09 2.1-1.78 3.56-1.8 1.17-.02 2.27.79 2.99.79.72 0 2.07-.97 3.48-.83.59.02 2.25.24 3.32 1.49Z"/>
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function AuthWelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)

  // Slight delay before animating in so images can start loading
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg)',
      overflow: 'hidden',
      transition: 'background-color 0.25s ease',
    }}>

      {/* ── Floating stamp decorations (background) ───── */}
      {DECO_STAMPS.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={ready ? {
            scale: 1,
            opacity: 1,
            x: FLOAT_PATHS[i].x,
            y: FLOAT_PATHS[i].y,
          } : {}}
          transition={{
            scale:   { type: 'spring', stiffness: 160, damping: 18, delay: s.delay + 0.2 },
            opacity: { duration: 0.6, delay: s.delay + 0.2 },
            x: { duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay + 0.6 },
            y: { duration: s.dur * 1.2, repeat: Infinity, ease: 'easeInOut', delay: s.delay + 0.6 },
          }}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2.5px solid var(--border)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <img
            src={s.img}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="eager"
          />
          {/* Subtle inner shadow to integrate with background */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
            pointerEvents: 'none',
          }} />
        </motion.div>
      ))}

      {/* ── Soft gradient fade at bottom — keeps buttons readable ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '55%',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
        pointerEvents: 'none',
        zIndex: 5,
        transition: 'background 0.25s ease',
      }} />

      {/* ── Content layer ─────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'max(64px, env(safe-area-inset-top))',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
      }}>

        {/* Logo + title */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40 }}>

          {/* Stamp icon — animated float */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: [0, -6, 0] } : {}}
            transition={{
              opacity: { duration: 0.5, delay: 0.15 },
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
            }}
            style={{ marginBottom: 18, display: 'inline-block' }}
          >
            <StampIcon />
          </motion.div>

          {/* "Patch" wordmark */}
          <div style={{ overflow: 'hidden', marginBottom: 12 }}>
            <motion.h1
              initial={{ y: '110%' }}
              animate={ready ? { y: 0 } : {}}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }}
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: '-1.5px',
                color: 'var(--text-primary)',
                lineHeight: 1,
                transition: 'color 0.25s ease',
              }}
            >
              Patch
            </motion.h1>
          </div>

          {/* Tagline — word by word */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 6px', overflow: 'hidden' }}>
            {['Collecte,', 'organise', 'et', 'partage', 'tes', 'stamps.'].map((word, i) => (
              <div key={i} style={{ overflow: 'hidden' }}>
                <motion.span
                  initial={{ y: '110%', opacity: 0 }}
                  animate={ready ? { y: 0, opacity: 1 } : {}}
                  transition={{
                    type: 'spring', stiffness: 220, damping: 26,
                    delay: 0.32 + i * 0.055,
                  }}
                  style={{
                    display: 'block',
                    fontSize: 17,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    transition: 'color 0.25s ease',
                  }}
                >
                  {word}
                </motion.span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 28, delay: 0.45 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {/* Connexion — primary */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/auth/login')}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: 'var(--text-primary)', color: 'var(--bg)',
              fontSize: 16, fontWeight: 600, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'background-color 0.25s ease, color 0.25s ease',
            }}
          >
            Connexion
          </motion.button>

          {/* S'inscrire — secondary */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/auth/register')}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontSize: 16, fontWeight: 600,
              border: '1.5px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
            }}
          >
            S&apos;inscrire
          </motion.button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', transition: 'background 0.25s ease' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)', transition: 'background 0.25s ease' }} />
          </div>

          {/* Google */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontSize: 15, fontWeight: 500,
              border: '1.5px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
            }}
          >
            <GoogleIcon />
            Continuer avec Google
          </motion.button>

          {/* Apple */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleApple}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontSize: 15, fontWeight: 500,
              border: '1.5px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
            }}
          >
            <AppleIcon />
            Continuer avec Apple
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
