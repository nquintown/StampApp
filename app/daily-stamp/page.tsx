'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] })

const STAMP_OUTER = 'M 100,100 Q 125,65 150,100 Q 175,65 200,100 Q 225,65 250,100 Q 275,65 300,100 Q 325,65 350,100 Q 375,65 400,100 Q 435,125 400,150 Q 435,175 400,200 Q 435,225 400,250 Q 435,275 400,300 Q 435,325 400,350 Q 435,375 400,400 Q 435,425 400,450 Q 435,475 400,500 Q 375,535 350,500 Q 325,535 300,500 Q 275,535 250,500 Q 225,535 200,500 Q 175,535 150,500 Q 125,535 100,500 Q 65,475 100,450 Q 65,425 100,400 Q 65,375 100,350 Q 65,325 100,300 Q 65,275 100,250 Q 65,225 100,200 Q 65,175 100,150 Q 65,125 100,100 Z'
const STAMP_INNER = 'M 130,135 Q 250,145 375,145 Q 365,300 360,470 Q 240,465 125,455 Q 125,300 130,135 Z'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function markDailyOk() {
  if (typeof window !== 'undefined')
    localStorage.setItem(`stamply_daily_ok_${todayISO()}`, 'true')
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M3 8.5C3 7.4 3.9 6.5 5 6.5H7.5L9.5 4H18.5L20.5 6.5H23C24.1 6.5 25 7.4 25 8.5V21C25 22.1 24.1 23 23 23H5C3.9 23 3 22.1 3 21V8.5Z"
        stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <circle cx="14" cy="14.5" r="4" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}

export default function DailyStampPage() {
  const router = useRouter()

  const skip = () => {
    markDailyOk()
    router.replace('/')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
      overflow: 'hidden',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px',
        }}
      >
        {/* Stamp preview with "+" */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ marginBottom: 36 }}
        >
          <svg viewBox="0 0 500 600" width="200" height="240">
            <defs>
              <linearGradient id="ds-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--surface2)" />
                <stop offset="100%" stopColor="var(--border)" />
              </linearGradient>
              <clipPath id="ds-clip"><path d={STAMP_INNER} /></clipPath>
            </defs>
            <g clipPath="url(#ds-clip)">
              <rect x="125" y="135" width="250" height="335" fill="url(#ds-grad)" />
              <motion.g
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '250px 302px' }}
              >
                <line x1="250" y1="260" x2="250" y2="344" stroke="var(--text-secondary)" strokeWidth="14" strokeLinecap="round" />
                <line x1="208" y1="302" x2="292" y2="302" stroke="var(--text-secondary)" strokeWidth="14" strokeLinecap="round" />
              </motion.g>
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
              <path d={STAMP_OUTER} /><path d={STAMP_INNER} strokeWidth="14" />
            </g>
          </svg>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <h1 className={playfair.className} style={{
            margin: '0 0 12px', fontSize: 30, fontWeight: 700,
            color: 'var(--text-primary)', letterSpacing: '-0.3px',
            lineHeight: 1.2, transition: 'color 0.25s ease',
          }}>
            Ton stamp du jour ✦
          </h1>
          <p style={{
            margin: 0, fontSize: 15, lineHeight: 1.6,
            color: 'var(--text-secondary)', transition: 'color 0.25s ease',
          }}>
            Capture le moment qui définit ta journée.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/camera?daily=true')}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14,
              background: 'var(--text-primary)', color: 'var(--bg)',
              fontSize: 16, fontWeight: 600, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background-color 0.25s ease, color 0.25s ease',
            }}
          >
            <CameraIcon />
            Créer mon stamp du jour
          </motion.button>
          <button
            onClick={skip}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
              fontFamily: 'inherit', padding: '8px 0', textAlign: 'center',
              transition: 'color 0.25s ease',
            }}
          >
            Plus tard
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
