'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] })

type Phase = 'splash' | 'onboarding' | 'permissions' | 'auth'
type OnboardingStep = 1 | 2 | 3

// Stamp SVG paths (reused across illustrations)
const STAMP_OUTER = 'M 100,100 Q 125,65 150,100 Q 175,65 200,100 Q 225,65 250,100 Q 275,65 300,100 Q 325,65 350,100 Q 375,65 400,100 Q 435,125 400,150 Q 435,175 400,200 Q 435,225 400,250 Q 435,275 400,300 Q 435,325 400,350 Q 435,375 400,400 Q 435,425 400,450 Q 435,475 400,500 Q 375,535 350,500 Q 325,535 300,500 Q 275,535 250,500 Q 225,535 200,500 Q 175,535 150,500 Q 125,535 100,500 Q 65,475 100,450 Q 65,425 100,400 Q 65,375 100,350 Q 65,325 100,300 Q 65,275 100,250 Q 65,225 100,200 Q 65,175 100,150 Q 65,125 100,100 Z'
const STAMP_INNER = 'M 130,135 Q 250,145 375,145 Q 365,300 360,470 Q 240,465 125,455 Q 125,300 130,135 Z'

// ── WaveDots ──────────────────────────────────────────────
function WaveDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width  = w
    canvas.height = h

    const isDark   = document.documentElement.classList.contains('dark')
    const dotColor = isDark ? '237,232,222' : '30,30,28'
    const SPACING  = 32
    const RADIUS   = 1.5
    const cols     = Math.ceil(w / SPACING) + 2
    const rows     = Math.ceil(h / SPACING) + 2

    const target  = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) target.x = e.gamma
      if (e.beta  !== null) target.y = e.beta
    }

    const attachGyro = () => {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      const onTouch = () => {
        ;(DeviceOrientationEvent as any)
          .requestPermission()
          .then((res: string) => { if (res === 'granted') attachGyro() })
          .catch(() => {})
        window.removeEventListener('touchstart', onTouch)
      }
      window.addEventListener('touchstart', onTouch, { once: true })
    } else {
      attachGyro()
    }

    let t = 0
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      current.x += (target.x - current.x) * 0.06
      current.y += (target.y - current.y) * 0.06
      const gx = current.x * 0.07
      const gy = current.y * 0.04

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x  = col * SPACING
          const y  = row * SPACING
          const v1 = Math.sin((x * 0.65 + y * 0.65) / 58 - t * 1.1 + gx)
          const v2 = Math.sin((x * 0.3  - y * 0.5)  / 72 + t * 0.7 - gy)
          const wave = ((v1 + v2) / 2 + 1) * 0.5
          const a  = isDark ? 0.03 + wave * 0.06 : 0.05 + wave * 0.07
          ctx.beginPath()
          ctx.arc(x, y, RADIUS, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${dotColor},${a.toFixed(3)})`
          ctx.fill()
        }
      }
      t += 0.018
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

// ── Illustration 1: Capture ───────────────────────────────
function IllustrationCapture() {
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <svg viewBox="0 0 500 600" width="190" height="228">
        <defs>
          <linearGradient id="il1-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FBE3B8" />
            <stop offset="42%"  stopColor="#E8956D" />
            <stop offset="100%" stopColor="#7DAA6E" />
          </linearGradient>
          <clipPath id="il1-clip">
            <path d={STAMP_INNER} />
          </clipPath>
        </defs>
        <g clipPath="url(#il1-clip)">
          <rect x="125" y="135" width="250" height="335" fill="url(#il1-sky)" />
          {/* Sun glow */}
          <motion.circle
            cx="222" cy="248" r="64"
            fill="#F5C87A" fillOpacity="0.28"
            animate={{ r: [64, 74, 64] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Sun */}
          <circle cx="222" cy="248" r="44" fill="#F5C87A" fillOpacity="0.92" />
          {/* Far hill */}
          <path d="M125 390 Q178 335 252 362 Q318 332 375 384 L375 470 L125 470 Z" fill="#5C7A5B" />
          {/* Near hill */}
          <path d="M125 435 Q198 396 268 418 Q328 400 375 432 L375 470 L125 470 Z" fill="#3D5C3E" />
          {/* Small tree */}
          <line x1="196" y1="390" x2="196" y2="352" stroke="#3D5C3E" strokeWidth="5" strokeLinecap="round" />
          <path d="M180 378 Q196 347 212 378" stroke="#3D5C3E" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
          <path d={STAMP_OUTER} />
          <path d={STAMP_INNER} strokeWidth="14" />
        </g>
      </svg>

    </motion.div>
  )
}

// ── Illustration 2: Collect ───────────────────────────────
function IllustrationCollect() {
  const stamps = [
    { dx: -52, dy: 22, rot: -11, z: 1, g1: '#C5DEB5', g2: '#7DAA6E', delay: 0.05 },
    { dx: 0,   dy: 4,  rot: 2,   z: 2, g1: '#FDDCCA', g2: '#E8956D', delay: 0.15 },
    { dx: 52,  dy: 16, rot: 11,  z: 3, g1: '#DBEAFE', g2: '#7B9BB2', delay: 0.25 },
  ]
  return (
    <div style={{ position: 'relative', width: 280, height: 230, margin: '0 auto' }}>
      {stamps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24, rotate: s.rot * 0.5 }}
          animate={{ opacity: 1, y: 0, rotate: s.rot }}
          transition={{ delay: s.delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: 'absolute',
            left: `calc(50% + ${s.dx}px - 77px)`,
            top: s.dy,
            zIndex: s.z,
          }}
        >
          <svg viewBox="0 0 500 600" width="154" height="185">
            <defs>
              <linearGradient id={`il2-g${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={s.g1} />
                <stop offset="100%" stopColor={s.g2} />
              </linearGradient>
              <clipPath id={`il2-c${i}`}>
                <path d={STAMP_INNER} />
              </clipPath>
            </defs>
            <g clipPath={`url(#il2-c${i})`}>
              <rect x="125" y="135" width="250" height="335" fill={`url(#il2-g${i})`} />
            </g>
            <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
              <path d={STAMP_OUTER} />
              <path d={STAMP_INNER} strokeWidth="14" />
            </g>
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

// ── Illustration 3: Share / Mosaic ────────────────────────
function IllustrationShare() {
  const cells = [
    { g1: '#FBD5A0', g2: '#E8956D', rot: -2 },
    { g1: '#C5DEB5', g2: '#7DAA6E', rot: 1  },
    { g1: '#DBEAFE', g2: '#7B9BB2', rot: -3 },
    { g1: '#FDDCCA', g2: '#D4845A', rot: 2  },
    { g1: '#E8D5F5', g2: '#B4A7D6', rot: -1 },
    { g1: '#D5EDD5', g2: '#5C8050', rot: 3  },
    { g1: '#FDE8C8', g2: '#E8A87C', rot: -2 },
    { g1: '#DBEAFE', g2: '#87BEEA', rot: 1  },
    { g1: '#FBD5A0', g2: '#C88B5A', rot: -3 },
    { g1: '#E0F0F0', g2: '#7BB8C0', rot: 2  },
    { g1: '#FDD5DD', g2: '#E8788A', rot: -1 },
    { g1: '#D5EDD5', g2: '#5C8050', rot: 0  },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7, width: 264 }}>
      {cells.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ transform: `rotate(${c.rot}deg)` }}
        >
          <div style={{
            padding: 5,
            backgroundImage: 'radial-gradient(circle, var(--bg) 3px, transparent 3px)',
            backgroundSize: '10px 10px',
          }}>
            <div style={{
              width: '100%',
              aspectRatio: '5/6',
              background: `linear-gradient(to bottom, ${c.g1}, ${c.g2})`,
              borderRadius: 2,
            }} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── StampIcon ─────────────────────────────────────────────
function StampIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 600"
      width={size}
      height={size * 1.2}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <style>{`
          .si-stamp-container {
            transform-origin: 250px 300px;
            animation: siJerkySwing 7s step-end infinite;
          }
          @keyframes siJerkySwing {
            0%     { transform: rotate(-4deg); }
            14.28% { transform: rotate(4deg); }
            42.85% { transform: rotate(-4deg); }
            85.71% { transform: rotate(4deg); }
            100%   { transform: rotate(-4deg); }
          }
          .si-draw {
            fill: none;
            stroke: currentColor;
            stroke-width: 12;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1500;
            stroke-dashoffset: 1500;
          }
          .si-flower { animation: siFlowerSeq 12s linear infinite; }
          .si-person { animation: siPersonSeq 12s linear infinite; }
          .si-tower  { animation: siTowerSeq  12s linear infinite; }
          @keyframes siFlowerSeq {
            0%      { stroke-dashoffset: 1500; }
            12.5%   { stroke-dashoffset: 0; }
            20.83%  { stroke-dashoffset: 0; }
            33.33%  { stroke-dashoffset: 1500; }
            100%    { stroke-dashoffset: 1500; }
          }
          @keyframes siPersonSeq {
            0%      { stroke-dashoffset: 1500; }
            33.33%  { stroke-dashoffset: 1500; }
            45.83%  { stroke-dashoffset: 0; }
            54.16%  { stroke-dashoffset: 0; }
            66.66%  { stroke-dashoffset: 1500; }
            100%    { stroke-dashoffset: 1500; }
          }
          @keyframes siTowerSeq {
            0%      { stroke-dashoffset: 1500; }
            66.66%  { stroke-dashoffset: 1500; }
            79.16%  { stroke-dashoffset: 0; }
            87.5%   { stroke-dashoffset: 0; }
            100%    { stroke-dashoffset: 1500; }
          }
        `}</style>
      </defs>
      <g className="si-stamp-container">
        <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 100,100 Q 125,65 150,100 Q 175,65 200,100 Q 225,65 250,100 Q 275,65 300,100 Q 325,65 350,100 Q 375,65 400,100 Q 435,125 400,150 Q 435,175 400,200 Q 435,225 400,250 Q 435,275 400,300 Q 435,325 400,350 Q 435,375 400,400 Q 435,425 400,450 Q 435,475 400,500 Q 375,535 350,500 Q 325,535 300,500 Q 275,535 250,500 Q 225,535 200,500 Q 175,535 150,500 Q 125,535 100,500 Q 65,475 100,450 Q 65,425 100,400 Q 65,375 100,350 Q 65,325 100,300 Q 65,275 100,250 Q 65,225 100,200 Q 65,175 100,150 Q 65,125 100,100 Z" />
          <path d="M 130,135 Q 250,145 375,145 Q 365,300 360,470 Q 240,465 125,455 Q 125,300 130,135 Z" strokeWidth="14" />
        </g>
        <g>
          <path className="si-draw si-flower" d="M250,430 Q240,330 250,240 M250,240 Q210,240 210,190 C210,140 240,150 250,180 C260,150 290,140 290,190 Q290,240 250,240 M250,360 Q210,340 190,280 Q220,380 250,380 M250,330 Q290,310 310,250 Q280,350 250,350" />
          <path className="si-draw si-person" d="M250,210 A30,30 0 1,1 249.9,210 M250,240 L250,360 M250,270 L190,320 M250,270 L310,320 M250,360 L200,440 M250,360 L300,440" />
          <path className="si-draw si-tower" d="M250,150 L240,250 L200,440 M250,150 L260,250 L300,440 M230,250 L270,250 M215,360 L285,360 M210,440 Q250,390 290,440 M245,150 L255,150 L250,130 Z M225,360 L260,250 M275,360 L240,250" />
        </g>
      </g>
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

// ── Slide variants ─────────────────────────────────────────
const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d < 0 ? 48 : -48, opacity: 0 }),
}

// ── Onboarding data ────────────────────────────────────────
const STEPS = [
  {
    illustration: <IllustrationCapture />,
    title: 'Chaque jour mérite un souvenir.',
    subtitle: 'Prends une photo de ta journée et ajoute quelques mots pour ne jamais oublier les petits moments.',
    cta: 'Continuer',
  },
  {
    illustration: <IllustrationCollect />,
    title: 'Tes souvenirs deviennent des stamps.',
    subtitle: 'Chaque photo du jour se transforme en stamp unique, comme un petit timbre de vie à garder ou à envoyer.',
    cta: 'Continuer',
  },
  {
    illustration: <IllustrationShare />,
    title: 'Partage tes stamps et revis ton mois.',
    subtitle: 'Ajoute tes amis, échange tes stamps et découvre chaque 1er du mois le récap de tous tes souvenirs.',
    cta: 'Commencer',
  },
]

// ── Page ───────────────────────────────────────────────────
export default function AuthWelcomePage() {
  const router  = useRouter()
  const supabase = createClient()

  const [phase,       setPhase]       = useState<Phase>('splash')
  const [step,        setStep]        = useState<OnboardingStep>(1)
  const [direction,   setDirection]   = useState(1)
  const [notifStatus, setNotifStatus] = useState<'pending' | 'granted' | 'denied'>('pending')

  useEffect(() => {
    const t = setTimeout(() => {
      const onboarded = typeof window !== 'undefined' && localStorage.getItem('stamply_onboarded')
      setPhase(onboarded ? 'auth' : 'onboarding')
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const goNext = () => {
    if (step < 3) {
      setDirection(1)
      setStep(s => (s + 1) as OnboardingStep)
    } else {
      setPhase('permissions')
    }
  }

  const skipOnboarding = () => {
    localStorage.setItem('stamply_onboarded', 'true')
    setPhase('auth')
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifStatus(perm === 'granted' ? 'granted' : 'denied')
    if (perm === 'granted' && 'serviceWorker' in navigator) {
      try {
        const reg  = await navigator.serviceWorker.ready
        const key  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!key) return
        const sub  = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
      } catch (_) {}
    }
  }

  const finishPermissions = () => {
    localStorage.setItem('stamply_onboarded', 'true')
    localStorage.setItem('stamply_new_user',  'true')
    setPhase('auth')
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

  const current = STEPS[step - 1]

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '15px 0', borderRadius: 14,
    background: 'var(--text-primary)', color: 'var(--bg)',
    fontSize: 16, fontWeight: 600, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
    transition: 'background-color 0.25s ease, color 0.25s ease',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
      overflow: 'hidden',
    }}>

      {/* Wave dots — always on except during splash */}
      {phase !== 'splash' && <WaveDots />}

      {/* ── SPLASH ──────────────────────────────────── */}
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
            <motion.div
              layoutId="auth-icon"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1.12, 0.94, 1.04, 1], opacity: [0, 1, 1, 1, 1] }}
              transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <StampIcon size={128} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ONBOARDING ──────────────────────────────── */}
      <AnimatePresence>
        {phase === 'onboarding' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', flexDirection: 'column',
              paddingTop: 'max(44px, env(safe-area-inset-top))',
              paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -60) {
                // swipe left → next
                if (step < 3) { setDirection(1); setStep(s => (s + 1) as OnboardingStep) }
                else setPhase('permissions')
              } else if (info.offset.x > 60 && step > 1) {
                // swipe right → prev
                setDirection(-1)
                setStep(s => (s - 1) as OnboardingStep)
              }
            }}
          >
            {/* Top bar — stepper centered, Passer right-absolute */}
            <div style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 8,
            }}>
              {/* Stepper centered */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {([1, 2, 3] as OnboardingStep[]).map(s => (
                  <motion.div
                    key={s}
                    animate={{
                      width:      s === step ? 22 : 6,
                      opacity:    s <= step  ? 1 : 0.3,
                      background: s === step ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ height: 6, borderRadius: 3 }}
                  />
                ))}
              </div>
              {/* Passer — absolute right */}
              <button
                onClick={skipOnboarding}
                style={{
                  position: 'absolute', right: 24,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
                  fontFamily: 'inherit', padding: '4px 0',
                  transition: 'color 0.25s ease',
                }}
              >
                Passer
              </button>
            </div>

            {/* Illustration */}
            <div style={{
              height: 290,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`ill-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {current.illustration}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text + CTA */}
            <div style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`text-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <h2 className={playfair.className} style={{
                    margin: 0, fontSize: 26, fontWeight: 700,
                    color: 'var(--text-primary)', letterSpacing: '-0.3px',
                    lineHeight: 1.25, transition: 'color 0.25s ease',
                  }}>
                    {current.title}
                  </h2>
                  <p style={{
                    margin: 0, fontSize: 14, lineHeight: 1.6,
                    color: 'var(--text-secondary)', transition: 'color 0.25s ease',
                  }}>
                    {current.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.button whileTap={{ scale: 0.97 }} onClick={goNext} style={btnPrimary}>
                {current.cta}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PERMISSIONS ─────────────────────────────── */}
      <AnimatePresence>
        {phase === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0,  opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', flexDirection: 'column',
              paddingLeft: 24, paddingRight: 24,
              paddingTop: 'max(56px, env(safe-area-inset-top))',
              paddingBottom: 'max(36px, env(safe-area-inset-bottom))',
            }}
          >
            {/* Center content */}
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 28,
            }}>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  width: 76, height: 76, borderRadius: 22,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34,
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                }}
              >
                ✨
              </motion.div>

              {/* Title + subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ textAlign: 'center', maxWidth: 300 }}
              >
                <h2 className={playfair.className} style={{
                  margin: '0 0 10px', fontSize: 26, fontWeight: 700,
                  color: 'var(--text-primary)', letterSpacing: '-0.3px',
                  transition: 'color 0.25s ease',
                }}>
                  Une dernière étape
                </h2>
                <p style={{
                  margin: 0, fontSize: 14, lineHeight: 1.6,
                  color: 'var(--text-secondary)', transition: 'color 0.25s ease',
                }}>
                  Ces accès te permettent de profiter pleinement de Stamply.
                </p>
              </motion.div>

              {/* Permission cards */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Camera card */}
                <div style={{
                  padding: '16px 18px', borderRadius: 16,
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: '#D5EDD5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    📷
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: 14, fontWeight: 600,
                      color: 'var(--text-primary)', transition: 'color 0.25s ease',
                    }}>
                      Caméra & Photos
                    </p>
                    <p style={{
                      margin: 0, fontSize: 12,
                      color: 'var(--text-secondary)', transition: 'color 0.25s ease',
                    }}>
                      Pour créer tes stamps du jour
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: '#5C7A5B', background: '#D5EDD5',
                    padding: '4px 9px', borderRadius: 7, flexShrink: 0,
                  }}>
                    Auto
                  </span>
                </div>

                {/* Notifications card */}
                <motion.div
                  whileTap={notifStatus === 'pending' ? { scale: 0.98 } : {}}
                  onClick={notifStatus === 'pending' ? requestNotifications : undefined}
                  style={{
                    padding: '16px 18px', borderRadius: 16,
                    background: 'var(--surface)', border: '1.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: notifStatus === 'pending' ? 'pointer' : 'default',
                    transition: 'background 0.25s ease, border-color 0.25s ease',
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: '#FDE8C8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    🔔
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 2px', fontSize: 14, fontWeight: 600,
                      color: 'var(--text-primary)', transition: 'color 0.25s ease',
                    }}>
                      Notifications
                    </p>
                    <p style={{
                      margin: 0, fontSize: 12,
                      color: 'var(--text-secondary)', transition: 'color 0.25s ease',
                    }}>
                      Pour ton rappel stamp quotidien
                    </p>
                  </div>
                  {notifStatus === 'pending' && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: '#9B6E3A', background: '#FDE8C8',
                      padding: '4px 9px', borderRadius: 7, flexShrink: 0,
                    }}>
                      Autoriser
                    </span>
                  )}
                  {notifStatus === 'granted' && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: '#5C7A5B', background: '#D5EDD5',
                      padding: '4px 9px', borderRadius: 7, flexShrink: 0,
                    }}>
                      ✓ OK
                    </span>
                  )}
                  {notifStatus === 'denied' && (
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: 'var(--text-secondary)', background: 'var(--surface2)',
                      padding: '4px 9px', borderRadius: 7, flexShrink: 0,
                      transition: 'color 0.25s ease, background 0.25s ease',
                    }}>
                      Plus tard
                    </span>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={finishPermissions}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={btnPrimary}
            >
              C&apos;est parti !
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AUTH ────────────────────────────────────── */}
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
            }}
          >
            {/* Center: icon + title */}
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20, position: 'relative', zIndex: 1,
            }}>
              <motion.div layoutId="auth-icon">
                <StampIcon size={128} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ textAlign: 'center' }}
              >
                <h1 className={playfair.className} style={{
                  margin: 0, fontSize: 34, fontWeight: 700,
                  letterSpacing: '-0.3px', color: 'var(--text-primary)',
                  transition: 'color 0.25s ease',
                }}>
                  Bienvenue sur Stamply
                </h1>
              </motion.div>
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                padding: '0 24px',
                display: 'flex', flexDirection: 'column', gap: 10,
                position: 'relative', zIndex: 1,
              }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth/login')}
                style={btnPrimary}
              >
                Connexion
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
                  transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease',
                }}
              >
                S&apos;inscrire
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)', transition: 'background 0.25s ease' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}>ou</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)', transition: 'background 0.25s ease' }} />
              </div>

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
