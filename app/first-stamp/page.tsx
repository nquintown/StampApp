'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] })

type Stage = 'welcome' | 'capture' | 'processing' | 'reveal'

const STAMP_OUTER = 'M 100,100 Q 125,65 150,100 Q 175,65 200,100 Q 225,65 250,100 Q 275,65 300,100 Q 325,65 350,100 Q 375,65 400,100 Q 435,125 400,150 Q 435,175 400,200 Q 435,225 400,250 Q 435,275 400,300 Q 435,325 400,350 Q 435,375 400,400 Q 435,425 400,450 Q 435,475 400,500 Q 375,535 350,500 Q 325,535 300,500 Q 275,535 250,500 Q 225,535 200,500 Q 175,535 150,500 Q 125,535 100,500 Q 65,475 100,450 Q 65,425 100,400 Q 65,375 100,350 Q 65,325 100,300 Q 65,275 100,250 Q 65,225 100,200 Q 65,175 100,150 Q 65,125 100,100 Z'
const STAMP_INNER = 'M 130,135 Q 250,145 375,145 Q 365,300 360,470 Q 240,465 125,455 Q 125,300 130,135 Z'

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M3 8.5C3 7.4 3.9 6.5 5 6.5H7.5L9.5 4H18.5L20.5 6.5H23C24.1 6.5 25 7.4 25 8.5V21C25 22.1 24.1 23 23 23H5C3.9 23 3 22.1 3 21V8.5Z"
        stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <circle cx="14" cy="14.5" r="4" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M6 16 L13 23 L26 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function FirstStampPage() {
  const router  = useRouter()
  const { user, addStamp } = useStore()

  const [stage,       setStage]       = useState<Stage>('welcome')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [savedStamp,  setSavedStamp]  = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [pickerOpen, setPickerOpen] = useState(false)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setPhotoDataUrl(dataUrl)
      setStage('processing')

      // Simulate processing + save stamp
      await new Promise(r => setTimeout(r, 2200))

      try {
        setSaving(true)
        const now = new Date().toISOString()
        const id  = `${Date.now()}-first`
        await addStamp({
          id,
          title:        'Mon premier stamp',
          imageUrl:     dataUrl,
          thumbnailUrl: dataUrl,
          createdAt:    now,
          sourceType:   'camera',
          collectionId: '',
          tags:         [],
          favorite:     false,
        })
        setSavedStamp(id)
      } catch (_) {}

      setSaving(false)
      setStage('reveal')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addStamp])

  const openPicker = (type: 'camera' | 'gallery') => {
    setPickerOpen(false)
    setTimeout(() => {
      if (type === 'camera') cameraInputRef.current?.click()
      else fileInputRef.current?.click()
    }, 120)
  }

  const goHome = () => {
    localStorage.removeItem('stamply_new_user')
    router.replace('/')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
      overflow: 'hidden',
    }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* ── WELCOME ─────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              paddingTop: 'max(56px, env(safe-area-inset-top))',
              paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
              padding: '0 32px',
            }}
          >
            {/* Stamp preview with "+" */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ marginBottom: 36 }}
            >
              <svg viewBox="0 0 500 600" width="200" height="240">
                <defs>
                  <linearGradient id="fs-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--surface2)" />
                    <stop offset="100%" stopColor="var(--border)" />
                  </linearGradient>
                  <clipPath id="fs-clip">
                    <path d={STAMP_INNER} />
                  </clipPath>
                </defs>
                <g clipPath="url(#fs-clip)">
                  <rect x="125" y="135" width="250" height="335" fill="url(#fs-grad)" />
                  {/* Plus icon */}
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
                  <path d={STAMP_OUTER} />
                  <path d={STAMP_INNER} strokeWidth="14" />
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
                Prends ton premier stamp ✨
              </h1>
              <p style={{
                margin: 0, fontSize: 15, lineHeight: 1.6,
                color: 'var(--text-secondary)', transition: 'color 0.25s ease',
              }}>
                Capture une photo de ta journée et vois la magie opérer.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setPickerOpen(true)}
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
                Ajouter une photo
              </motion.button>

              <button
                onClick={goHome}
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
        )}
      </AnimatePresence>

      {/* ── PROCESSING ──────────────────────────────── */}
      <AnimatePresence>
        {stage === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 32,
              backgroundColor: '#111110',
            }}
          >
            {/* Stamp with photo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {photoDataUrl && (
                <svg viewBox="0 0 500 600" width="200" height="240">
                  <defs>
                    <clipPath id="proc-clip">
                      <path d={STAMP_INNER} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#proc-clip)">
                    <image
                      href={photoDataUrl}
                      x="125" y="135" width="250" height="335"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <g fill="none" stroke="white" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                    <path d={STAMP_OUTER} />
                    <path d={STAMP_INNER} strokeWidth="14" />
                  </g>
                </svg>
              )}
            </motion.div>

            {/* Loading dots */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(237,232,222,0.7)' }}
                />
              ))}
            </div>
            <p style={{
              fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'rgba(237,232,222,0.5)', margin: 0, fontWeight: 500,
            }}>
              Création en cours…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REVEAL ──────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              paddingTop: 'max(56px, env(safe-area-inset-top))',
              paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
              padding: '0 32px',
              gap: 32,
            }}
          >
            {/* Stamp reveal */}
            <motion.div
              initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
              animate={{ scale: 1,   rotate: 0,  opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.1] }}
              style={{ position: 'relative' }}
            >
              {photoDataUrl && (
                <svg viewBox="0 0 500 600" width="220" height="264">
                  <defs>
                    <clipPath id="rev-clip">
                      <path d={STAMP_INNER} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#rev-clip)">
                    <image
                      href={photoDataUrl}
                      x="125" y="135" width="250" height="335"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <g fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
                    <path d={STAMP_OUTER} />
                    <path d={STAMP_INNER} strokeWidth="14" />
                  </g>
                </svg>
              )}

              {/* Confetti check badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
                style={{
                  position: 'absolute', bottom: 8, right: -12,
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '3px solid var(--bg)',
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                }}
              >
                <CheckIcon />
              </motion.div>
            </motion.div>

            {/* Congrats text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              style={{ textAlign: 'center', maxWidth: 300 }}
            >
              <h1 className={playfair.className} style={{
                margin: '0 0 12px', fontSize: 28, fontWeight: 700,
                color: 'var(--text-primary)', letterSpacing: '-0.3px',
                lineHeight: 1.2, transition: 'color 0.25s ease',
              }}>
                Ton premier stamp est créé !
              </h1>
              <p style={{
                margin: 0, fontSize: 14, lineHeight: 1.6,
                color: 'var(--text-secondary)', transition: 'color 0.25s ease',
              }}>
                Il rejoindra ta collection chaque jour. Continue sur ta lancée !
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{ width: '100%' }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goHome}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 14,
                  background: 'var(--text-primary)', color: 'var(--bg)',
                  fontSize: 16, fontWeight: 600, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background-color 0.25s ease, color 0.25s ease',
                }}
              >
                Voir ma collection
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo picker bottom sheet ────────────────── */}
      <AnimatePresence>
        {pickerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPickerOpen(false)}
              style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,0,0,0.35)',
              }}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 11,
                background: 'var(--surface)',
                borderRadius: '20px 20px 0 0',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 20px' }} />
              {[
                { label: 'Prendre une photo',    action: () => openPicker('camera')  },
                { label: 'Depuis la galerie',    action: () => openPicker('gallery') },
              ].map(({ label, action }) => (
                <motion.button
                  key={label}
                  whileTap={{ scale: 0.98 }}
                  onClick={action}
                  style={{
                    width: '100%', padding: '16px 24px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontSize: 16, fontWeight: 500,
                    color: 'var(--text-primary)', fontFamily: 'inherit',
                    transition: 'color 0.25s ease',
                  }}
                >
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
