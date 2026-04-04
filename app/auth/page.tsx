'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function StampIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
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

export default function AuthWelcomePage() {
  const router = useRouter()
  const supabase = createClient()

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
    <div className="app-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      padding: '0 24px',
      paddingTop: 'max(64px, env(safe-area-inset-top))',
      paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
    }}>
      {/* Logo + name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <StampIcon />
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Patch
          </span>
        </div>

        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: 280,
          margin: 0,
        }}>
          Collect, organize and share your stamps — beautifully.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Primary buttons */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/auth/login')}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: 'var(--text-primary)', color: 'var(--bg)',
            fontSize: 16, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}
        >
          Login
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/auth/register')}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            background: 'var(--surface)', color: 'var(--text-primary)',
            fontSize: 16, fontWeight: 600,
            border: '1.5px solid var(--border)',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
          }}
        >
          Sign up
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Social buttons */}
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
          }}
        >
          <GoogleIcon />
          Continue with Google
        </motion.button>

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
          }}
        >
          <AppleIcon />
          Continue with Apple
        </motion.button>
      </motion.div>
    </div>
  )
}
