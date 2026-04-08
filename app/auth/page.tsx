'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Demo stamp images for bubbles ──────────────────────────
const BUBBLE_IMAGES = [
  'https://picsum.photos/seed/stamp1/300/300',
  'https://picsum.photos/seed/stamp3/300/300',
  'https://picsum.photos/seed/stamp5/300/300',
  'https://picsum.photos/seed/stamp7/300/300',
  'https://picsum.photos/seed/stamp9/300/300',
  'https://picsum.photos/seed/stamp2/300/300',
  'https://picsum.photos/seed/stamp4/300/300',
  'https://picsum.photos/seed/stamp6/300/300',
]

// ── Bubble layout + float animation config ─────────────────
const BUBBLES = [
  { id: 0, size: 112, left: '4%',   top: '4%',  floatX: [0, 14, -8, 10, 0],  floatY: [0, -20, 10, -14, 0], dur: 9.2,  featured: false },
  { id: 1, size: 66,  left: '73%',  top: '5%',  floatX: [0, -12, 16, -6, 0], floatY: [0, -14, 6, -18, 0],  dur: 11.5, featured: false },
  { id: 2, size: 54,  left: '-3%',  top: '27%', floatX: [0, 16, -8, 12, 0],  floatY: [0, -12, 16, -8, 0],  dur: 8.3,  featured: false },
  { id: 3, size: 100, left: '24%',  top: '15%', floatX: [0, -10, 14, -7, 0], floatY: [0, -18, 8, -22, 0],  dur: 12.1, featured: true  },
  { id: 4, size: 58,  left: '79%',  top: '24%', floatX: [0, -14, 10, -18, 0],floatY: [0, 12, -16, 10, 0],  dur: 10.4, featured: false },
  { id: 5, size: 78,  left: '2%',   top: '48%', floatX: [0, 12, -16, 8, 0],  floatY: [0, -10, 14, -8, 0],  dur: 13.2, featured: false },
  { id: 6, size: 64,  left: '59%',  top: '40%', floatX: [0, -8, 10, -12, 0], floatY: [0, -14, 8, -16, 0],  dur: 9.7,  featured: false },
  { id: 7, size: 60,  left: '76%',  top: '51%', floatX: [0, 8, -14, 10, 0],  floatY: [0, -12, 16, -10, 0], dur: 11.0, featured: false },
]

const ROTATING_LABELS = ['Capture ✦', 'Organise ✦', 'Partage ✦']

// ── Soap bubble visual component ───────────────────────────
function SoapBubble({ size, imgSrc, labelIdx, featured }: {
  size: number
  imgSrc: string
  labelIdx: number
  featured: boolean
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Gradient ring (soap film rim) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        padding: 2,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,180,120,0.2) 30%, rgba(150,120,255,0.25) 60%, rgba(255,255,255,0.15) 100%)',
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'transparent' }} />
      </div>

      {/* Photo + overlays container */}
      <div style={{
        position: 'absolute', inset: 2, borderRadius: '50%', overflow: 'hidden',
        boxShadow: 'inset 0 -6px 16px rgba(0,0,0,0.45)',
      }}>
        {/* Photo */}
        <img
          src={imgSrc}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />

        {/* Iridescent tint overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: [
            'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.22) 0%, transparent 48%)',
            'conic-gradient(from 110deg, rgba(255,110,130,0.1), rgba(110,130,255,0.12), rgba(110,255,200,0.08), rgba(255,200,110,0.12), rgba(255,110,130,0.1))',
          ].join(', '),
        }} />

        {/* Specular highlight (top-left glint) */}
        <div style={{
          position: 'absolute',
          top: '8%', left: '16%',
          width: '38%', height: '19%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.38)',
          filter: 'blur(5px)',
          transform: 'rotate(-22deg)',
        }} />

        {/* Bottom dark vignette inside bubble */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 110%, rgba(0,0,0,0.45) 0%, transparent 65%)',
        }} />
      </div>

      {/* Featured label pill */}
      {featured && (
        <div style={{
          position: 'absolute',
          bottom: -10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
          whiteSpace: 'nowrap',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={labelIdx}
              initial={{ opacity: 0, y: 6, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.92 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                backgroundColor: 'rgba(20,18,14,0.82)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.92)',
                letterSpacing: '0.02em',
              }}
            >
              {ROTATING_LABELS[labelIdx]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────────
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
  const [phase, setPhase] = useState<'intro' | 'main'>('intro')
  const [labelIdx, setLabelIdx] = useState(0)

  // Switch to main phase after intro bubble animation
  useEffect(() => {
    const t = setTimeout(() => setPhase('main'), 1750)
    return () => clearTimeout(t)
  }, [])

  // Rotate featured bubble label
  useEffect(() => {
    if (phase !== 'main') return
    const t = setInterval(() => setLabelIdx((i) => (i + 1) % ROTATING_LABELS.length), 2600)
    return () => clearInterval(t)
  }, [phase])

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
      position: 'fixed', inset: 0, overflow: 'hidden',
      backgroundColor: '#11100D',
    }}>
      {/* ── Background gradient layers ────────────────── */}

      {/* Warm amber radial — top center */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 85% 55% at 50% -2%, rgba(185,105,38,0.65) 0%, rgba(130,65,20,0.3) 50%, transparent 75%)',
      }} />

      {/* Mid warm haze */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 20% 40%, rgba(140,70,25,0.18) 0%, transparent 70%)',
      }} />

      {/* Cool blue radial — bottom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 55% 30% at 50% 108%, rgba(45,75,210,0.32) 0%, transparent 70%)',
      }} />

      {/* Perimeter vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 90% at 50% 50%, transparent 38%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* ── Intro bubble (inflates then pops) ─────────── */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale:   [0, 0.12, 0.45, 3.8, 0.04],
              opacity: [0, 0.8,  0.95, 0.55, 0],
            }}
            transition={{
              duration: 1.65,
              times: [0, 0.1, 0.3, 0.82, 1],
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: 'calc(50% - 35vw)',
              bottom: '8%',
              width: '70vw',
              height: '70vw',
              borderRadius: '50%',
              background: [
                'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.22) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 50%, rgba(200,140,60,0.08), rgba(80,100,220,0.06), transparent 80%)',
              ].join(', '),
              border: '2px solid rgba(255,255,255,0.22)',
              boxShadow: [
                '0 0 50px rgba(210,145,70,0.28)',
                '0 0 110px rgba(70,100,230,0.2)',
                'inset 0 0 40px rgba(255,255,255,0.04)',
              ].join(', '),
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Floating bubbles ──────────────────────────── */}
      {phase === 'main' && BUBBLES.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            x: b.floatX,
            y: b.floatY,
          }}
          transition={{
            scale:   { type: 'spring', stiffness: 190, damping: 17, delay: i * 0.07 },
            opacity: { duration: 0.5, delay: i * 0.07 },
            x: { duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 + 0.3 },
            y: { duration: b.dur * 1.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 + 0.3 },
          }}
          style={{
            position: 'absolute',
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
          }}
        >
          <SoapBubble
            size={b.size}
            imgSrc={BUBBLE_IMAGES[i]}
            featured={b.featured}
            labelIdx={labelIdx}
          />
        </motion.div>
      ))}

      {/* ── Content (title + buttons) ─────────────────── */}
      {phase === 'main' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
          pointerEvents: 'none',
        }}>

          {/* Title — top area */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ paddingLeft: 28, pointerEvents: 'none' }}
          >
            <p style={{
              margin: '0 0 5px',
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Bienvenue sur
            </p>
            <h1 style={{
              margin: '0 0 10px',
              fontSize: 52, fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}>
              Patch
            </h1>
            <p style={{
              margin: 0,
              fontSize: 15, lineHeight: 1.6,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 220,
            }}>
              Collecte tes moments,<br />un stamp à la fois.
            </p>
          </motion.div>

          <div style={{ flex: 1 }} />

          {/* Buttons — bottom area */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              padding: '20px 22px 0',
              pointerEvents: 'auto',
            }}
          >
            {/* Glass backdrop behind buttons */}
            <div style={{
              backgroundColor: 'rgba(12,10,8,0.45)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '18px 18px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {/* Connexion — primary */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth/login')}
                style={{
                  width: '100%', padding: '16px', borderRadius: 50,
                  background: '#F7F4ED', color: '#1E1E1C',
                  fontSize: 16, fontWeight: 700, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              >
                Connexion
              </motion.button>

              {/* S'inscrire — secondary */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth/register')}
                style={{
                  width: '100%', padding: '16px', borderRadius: 50,
                  background: 'rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 16, fontWeight: 600,
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              >
                S&apos;inscrire
              </motion.button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 4px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>ou</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Google */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGoogle}
                style={{
                  width: '100%', padding: '13px', borderRadius: 50,
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 14, fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
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
                  width: '100%', padding: '13px', borderRadius: 50,
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 14, fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <AppleIcon />
                Continuer avec Apple
              </motion.button>

              <p style={{
                textAlign: 'center', fontSize: 11,
                color: 'rgba(255,255,255,0.22)',
                margin: '2px 0 6px',
                lineHeight: 1.5,
              }}>
                En utilisant Patch, vous acceptez nos conditions d&apos;utilisation.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
