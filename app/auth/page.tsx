'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Phase = 'splash' | 'auth'

// ── Icons ──────────────────────────────────────────────────
function StampIcon({ size = 56 }: { size?: number }) {
  const r = size * 0.25
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx={r} fill="var(--text-primary)" />
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

// ── Page ───────────────────────────────────────────────────
export default function AuthWelcomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [phase, setPhase] = useState<Phase>('splash')

  useEffect(() => {
    const t = setTimeout(() => setPhase('auth'), 1500)
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
      transition: 'background-color 0.25s ease',
    }}>

      {/* ── SPLASH ────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Icon springs in, then does a little "stamp" press */}
            <motion.div
              layoutId="auth-icon"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale:   [0.6, 1.12, 0.94, 1.04, 1],
                opacity: [0, 1,    1,    1,    1],
              }}
              transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <StampIcon size={64} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AUTH ──────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              paddingTop: 'max(56px, env(safe-area-inset-top))',
              paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
              /* Dot grid */
              backgroundImage: 'radial-gradient(circle, var(--dot) 1.3px, transparent 1.3px)',
              backgroundSize: '22px 22px',
            }}
          >
            {/* Center section: icon + title */}
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20,
            }}>
              {/* Icon — layoutId matches splash icon, animates from center */}
              <motion.div layoutId="auth-icon">
                <StampIcon size={64} />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ textAlign: 'center' }}
              >
                <h1 style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: 'var(--text-primary)',
                  transition: 'color 0.25s ease',
                }}>
                  Bienvenue sur Patch
                </h1>
              </motion.div>
            </div>

            {/* Bottom: buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Connexion */}
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

              {/* S'inscrire */}
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

              <p style={{
                textAlign: 'center', fontSize: 12,
                color: 'var(--text-secondary)', margin: '4px 0 0',
                lineHeight: 1.5, transition: 'color 0.25s ease',
              }}>
                En continuant, vous acceptez nos conditions d&apos;utilisation.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
