'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function BackIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M8.5 1 1.5 8l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="currentColor">
      <path d="M12.627 1c.05.518-.14 1.04-.43 1.43-.3.4-.77.72-1.27.68-.06-.5.15-1.02.43-1.4.29-.39.79-.7 1.27-.71Zm2.04 4.01c-.28.17-2.56 1.47-2.53 4.14.03 2.77 2.44 3.77 2.5 3.8-.02.08-.38 1.3-1.27 2.54-.77 1.1-1.58 2.18-2.81 2.2-1.21.02-1.6-.72-2.98-.72-1.39 0-1.82.7-2.97.74-1.19.04-2.1-1.18-2.87-2.27C.24 13.72-.79 10.55.73 8.36c.76-1.09 2.1-1.78 3.56-1.8 1.17-.02 2.27.79 2.99.79.72 0 2.07-.97 3.48-.83.59.02 2.25.24 3.32 1.49Z"/>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/')
  }

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
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
    }}>
      {/* Back */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.back()}
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'var(--surface2)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-primary)', marginBottom: 32,
        }}
      >
        <BackIcon />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            Connexion
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Connecte-toi à ton compte
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Adresse e-mail
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m2 7 10 7 10-7"/>
                </svg>
              </div>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="hello@example.com"
                style={{
                  width: '100%', padding: '14px 14px 14px 42px',
                  borderRadius: 12, border: '1.5px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                  fontSize: 15, fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%', padding: '14px 44px 14px 42px',
                  borderRadius: 12, border: '1.5px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text-primary)',
                  fontSize: 15, fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button" onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: 0, display: 'flex',
                }}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" style={{ accentColor: 'var(--text-primary)', width: 15, height: 15 }} />
              Se souvenir de moi
            </label>
            <button
              type="button"
              onClick={() => router.push('/auth/forgot')}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, color: '#E05252', margin: 0, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10 }}>
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, marginTop: 4,
              background: loading ? 'var(--text-secondary)' : 'var(--text-primary)',
              color: 'var(--bg)', fontSize: 16, fontWeight: 600,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Connexion...' : 'Connexion'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Social */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGoogle}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontSize: 15, fontWeight: 500, border: '1.5px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            <GoogleIcon /> Continuer avec Google
          </motion.button>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleApple}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'var(--surface)', color: 'var(--text-primary)',
              fontSize: 15, fontWeight: 500, border: '1.5px solid var(--border)',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            <AppleIcon /> Continuer avec Apple
          </motion.button>
        </div>

        {/* Switch to register */}
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', marginTop: 28 }}>
          Pas encore de compte ?{' '}
          <button
            onClick={() => router.push('/auth/register')}
            style={{ fontWeight: 600, color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
          >
            S&apos;inscrire
          </button>
        </p>
      </motion.div>
    </div>
  )
}
