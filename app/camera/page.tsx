'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import CameraStampFrame, { OW, OH, OX, OY, OR, OY_OFFSET } from '@/components/CameraStampFrame'
import StampShape from '@/components/StampShape'
import CollectionPickerSheet from '@/components/CollectionPickerSheet'
import type { Stamp, StampLocation, PhotoTransform } from '@/lib/types'

type Stage = 'device' | 'adjust' | 'processing' | 'name'

interface PhotoTransform {
  x: number
  y: number
  scale: number
  rotation: number
}

// ── Reverse geocode ──────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en-US' } }
    )
    const data = await res.json()
    const addr = data.address ?? {}
    const city = addr.city || addr.town || addr.village || addr.hamlet || ''
    const country = addr.country || ''
    return [city, country].filter(Boolean).join(', ')
  } catch {
    return ''
  }
}

// ─────────────────────────────────────────────────────────
export default function CameraPage() {
  const router = useRouter()
  const { addStamp, collections } = useStore()

  // Single file input (on iOS triggers native photo/camera/files picker)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Gesture container
  const gestureRef = useRef<HTMLDivElement>(null)

  // App state
  const [stage, setStage]   = useState<Stage>('device')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null)
  const [savedTransform, setSavedTransform] = useState<PhotoTransform | null>(null)
  const [title, setTitle]   = useState('')
  const [location, setLocation] = useState<StampLocation | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState('all')
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false)


  // Photo transform — ref is the source of truth for touch handlers (avoids stale closures)
  const transformRef = useRef<PhotoTransform>({ x: 0, y: 0, scale: 1, rotation: 0 })
  const [transform, setTransformState] = useState<PhotoTransform>({ x: 0, y: 0, scale: 1, rotation: 0 })
  const setTransform = useCallback((t: PhotoTransform) => {
    transformRef.current = t
    setTransformState(t)
  }, [])

  // Touch tracking
  const touchRef = useRef<{
    touches: { x: number; y: number }[]
    lastDist: number
    lastAngle: number
    lastMidX: number
    lastMidY: number
  } | null>(null)

  // Mouse drag (desktop)
  const mouseDragRef = useRef<{ startX: number; startY: number; active: boolean }>({ startX: 0, startY: 0, active: false })

  // ── Geolocation ──────────────────────────────────────
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lng } }) => {
          const label = await reverseGeocode(lat, lng)
          setLocation({ lat, lng, label: label || undefined })
        },
        () => {},
        { timeout: 8000 }
      )
    }
  }, [])

  // ── Touch gesture listeners (non-passive for preventDefault) ──
  useEffect(() => {
    if (stage !== 'adjust') return
    const el = gestureRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
      if (touches.length === 1) {
        touchRef.current = {
          touches, lastDist: 0, lastAngle: 0,
          lastMidX: touches[0].x, lastMidY: touches[0].y,
        }
      } else if (touches.length >= 2) {
        const [t1, t2] = touches
        touchRef.current = {
          touches,
          lastDist:  Math.hypot(t2.x - t1.x, t2.y - t1.y),
          lastAngle: Math.atan2(t2.y - t1.y, t2.x - t1.x),
          lastMidX:  (t1.x + t2.x) / 2,
          lastMidY:  (t1.y + t2.y) / 2,
        }
      }
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      if (!touchRef.current) return
      const prev = touchRef.current
      const touches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))

      if (touches.length === 1) {
        const dx = touches[0].x - prev.lastMidX
        const dy = touches[0].y - prev.lastMidY
        const next: PhotoTransform = { ...transformRef.current, x: transformRef.current.x + dx, y: transformRef.current.y + dy }
        transformRef.current = next
        setTransformState(next)
        touchRef.current = { ...prev, touches, lastMidX: touches[0].x, lastMidY: touches[0].y }
      } else if (touches.length >= 2) {
        const [t1, t2] = touches
        const dist  = Math.hypot(t2.x - t1.x, t2.y - t1.y)
        const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x)
        const midX  = (t1.x + t2.x) / 2
        const midY  = (t1.y + t2.y) / 2

        const scaleChange = prev.lastDist > 0 ? dist / prev.lastDist : 1
        const angleChange = angle - prev.lastAngle

        const cur = transformRef.current
        const next: PhotoTransform = {
          x: cur.x + (midX - prev.lastMidX),
          y: cur.y + (midY - prev.lastMidY),
          scale:    Math.max(0.15, Math.min(10, cur.scale * scaleChange)),
          rotation: cur.rotation + angleChange * (180 / Math.PI),
        }
        transformRef.current = next
        setTransformState(next)
        touchRef.current = { touches, lastDist: dist, lastAngle: angle, lastMidX: midX, lastMidY: midY }
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
    }
  }, [stage])

  // ── Mouse drag (desktop testing) ──────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    mouseDragRef.current = { startX: e.clientX, startY: e.clientY, active: true }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseDragRef.current.active) return
    const dx = e.clientX - mouseDragRef.current.startX
    const dy = e.clientY - mouseDragRef.current.startY
    mouseDragRef.current.startX = e.clientX
    mouseDragRef.current.startY = e.clientY
    const next: PhotoTransform = { ...transformRef.current, x: transformRef.current.x + dx, y: transformRef.current.y + dy }
    transformRef.current = next
    setTransformState(next)
  }
  const onMouseUp = () => { mouseDragRef.current.active = false }

  // ── Handle file selection ─────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      setSelectedImage(src)
      setTransform({ x: 0, y: 0, scale: 1, rotation: 0 })
      setStage('adjust')
    }
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting same file
  }

  // ── Cut stamp from current photo + transform ──────────
  const handleCut = useCallback(async () => {
    if (!selectedImage) return
    setStage('processing')

    const img = new Image()
    img.src = selectedImage
    await new Promise<void>(r => { img.onload = () => r() })

    const screenW = window.innerWidth
    const screenH = window.innerHeight

    // Object-fit cover dimensions
    const imgAspect    = img.naturalWidth / img.naturalHeight
    const screenAspect = screenW / screenH
    let drawW: number, drawH: number
    if (imgAspect > screenAspect) {
      drawH = screenH; drawW = drawH * imgAspect
    } else {
      drawW = screenW; drawH = drawW / imgAspect
    }
    const drawX = (screenW - drawW) / 2
    const drawY = (screenH - drawH) / 2

    // Output canvas = stamp opening at 3× resolution
    const outW = OW * 3
    const outH = OH * 3
    const canvas = document.createElement('canvas')
    canvas.width = outW; canvas.height = outH
    const ctx = canvas.getContext('2d')!

    const t = transformRef.current

    // Draw the image with the same transforms that CSS applies,
    // but centered on the canvas (= stamp window = screen center).
    // Whatever appears at screen center will appear at canvas center,
    // and the canvas captures exactly the stamp-window-sized area.
    ctx.save()
    ctx.translate(outW / 2, outH / 2)        // canvas origin = stamp/screen center
    ctx.scale(outW / OW, outH / OH)           // screen px → canvas px (3×)
    ctx.translate(t.x, t.y)                   // same translate as CSS
    ctx.rotate(t.rotation * Math.PI / 180)    // same rotate as CSS
    ctx.scale(t.scale, t.scale)               // same scale as CSS
    ctx.drawImage(img, drawX - screenW / 2, drawY - screenH / 2, drawW, drawH)
    ctx.restore()

    const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.93)
    setCapturedThumbnail(thumbnailDataUrl)
    setCapturedImage(selectedImage)
    setSavedTransform({ ...transformRef.current })
    setTimeout(() => setStage('name'), 420)
  }, [selectedImage])

  // ── Save stamp ────────────────────────────────────────
  const handleSave = () => {
    if (!capturedImage || !title.trim()) return
    const stamp: Stamp = {
      id:           `stamp-cam-${Date.now()}`,
      title:        title.trim(),
      imageUrl:       capturedImage,
      thumbnailUrl:   capturedThumbnail ?? capturedImage,
      photoTransform: savedTransform ?? undefined,
      createdAt:    new Date().toISOString(),
      sourceType:   'camera',
      sourceLabel:  'Camera',
      collectionId: selectedCollectionId,
      tags:         [],
      dominantColor: '#60A5FA',
      favorite:     false,
      location:     location ?? undefined,
    }
    addStamp(stamp)
    router.push('/')
  }

  // ════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg)', overflow: 'hidden' }}
    >
      {/* Single hidden file input — iOS shows native picker automatically */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* ══ STAGE: DEVICE ════════════════════════════════ */}
      <AnimatePresence>
        {stage === 'device' && (
          <motion.div
            key="device"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Top bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '16px 20px',
              paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}>
              <SmallButton onClick={() => router.back()}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SmallButton>
              <span style={{
                flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600,
                color: 'var(--text-primary)', marginRight: 36, letterSpacing: '-0.2px',
              }}>
                New Stamp
              </span>
            </div>

            {/* Device + tap area */}
            <div
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ position: 'relative' }}>
                <CameraStampFrame isProcessing={false} />

                {/* Placeholder icon inside the opening */}
                <div style={{
                  position: 'absolute',
                  left: OX, top: OY,
                  width: OW, height: OH,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      {/* Image frame */}
                      <rect x="2" y="7" width="30" height="24" rx="3.5" stroke="var(--text-secondary)" strokeWidth="1.5" />
                      {/* Sun */}
                      <circle cx="10" cy="15" r="3" stroke="var(--text-secondary)" strokeWidth="1.5" />
                      {/* Landscape */}
                      <path d="M2 23l7-7 6 6.5 5-4.5 12 7" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* + badge */}
                      <circle cx="38" cy="12" r="10" fill="var(--bg)" />
                      <circle cx="38" cy="12" r="9" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface)" />
                      <path d="M38 7.5v9M33.5 12h9" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Hint */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.45 }}
              style={{
                textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)',
                paddingBottom: 'max(44px, env(safe-area-inset-bottom, 44px))',
                letterSpacing: '-0.1px',
              }}
            >
              Tap to add a photo
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ STAGE: ADJUST ════════════════════════════════ */}
      <AnimatePresence>
        {stage === 'adjust' && (
          <motion.div
            key="adjust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Gesture / photo layer */}
            <div
              ref={gestureRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{
                position: 'absolute', inset: 0,
                overflow: 'hidden',
                touchAction: 'none',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transformOrigin: 'center center',
                    transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scale})`,
                    pointerEvents: 'none',
                    willChange: 'transform',
                  }}
                />
              )}
            </div>

            {/* Stamp device overlay — no pointer events (touches go through to gesture div) */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              {/* Dark vignette outside device */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }} />
              {/* Shift frame UP by OY_OFFSET so the stamp opening sits exactly at screen centre.
                  This keeps handleCut's crop math accurate (it assumes opening centre = screen centre). */}
              <div style={{ marginTop: -OY_OFFSET * 2 }}>
                <CameraStampFrame isProcessing={false} />
              </div>
            </div>

            {/* ── Top bar ── */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}>
              {/* Close / back */}
              <GlassButton onClick={() => setStage('device')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </GlassButton>

              {/* Hint */}
              <span style={{
                fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.02em', textAlign: 'center',
              }}>
                Pinch · Drag · Rotate
              </span>

              {/* Reset */}
              <GlassButton onClick={() => setTransform({ x: 0, y: 0, scale: 1, rotation: 0 })}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 8C2.5 4.96 4.96 2.5 8 2.5C9.72 2.5 11.26 3.3 12.3 4.5M13.5 8C13.5 11.04 11.04 13.5 8 13.5C6.28 13.5 4.74 12.7 3.7 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12.3 4.5L12.3 2.2M12.3 4.5L10.1 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </GlassButton>
            </div>

            {/* ── Cut button ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.12 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
                padding: '16px 24px',
                paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCut}
                style={{
                  width: '100%', padding: '17px', borderRadius: 50,
                  backgroundColor: '#1E1E1C', border: 'none',
                  color: '#F7F4ED', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: '-0.2px',
                  WebkitTapHighlightColor: 'transparent',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.45)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.5 2" />
                  <path d="M9 5.5V12.5M5.5 9H12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Cut your stamp
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ STAGE: PROCESSING ════════════════════════════ */}
      <AnimatePresence>
        {stage === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute', inset: 0, backgroundColor: '#111110',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
            }}
          >
            <CameraStampFrame isProcessing capturedImage={capturedThumbnail ?? capturedImage} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.14 }}
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA' }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                Stamping…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ STAGE: NAME ══════════════════════════════════ */}
      <AnimatePresence>
        {stage === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{ position: 'absolute', inset: 0, backgroundColor: '#F7F4ED', display: 'flex', flexDirection: 'column' }}
          >
            {/* Top bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '16px 20px',
              paddingTop: 'max(16px, env(safe-area-inset-top))',
            }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setStage('adjust')}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: 'rgba(30,30,28,0.07)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#1E1E1C',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
              <span style={{
                flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600,
                color: '#1E1E1C', letterSpacing: '-0.2px', marginRight: 36,
              }}>
                Name your stamp
              </span>
            </div>

            {/* Content */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0 24px 24px', gap: 28, overflowY: 'auto',
            }}>
              {capturedThumbnail && (
                <motion.div
                  initial={{ scale: 0.55, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22, mass: 0.8, delay: 0.02 }}
                >
                  <StampShape imageUrl={capturedThumbnail} alt="Your stamp" width={180} height={225} />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Title */}
                <div>
                  <p style={{ fontSize: 12, color: '#6B6B67', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                    Stamp title
                  </p>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your stamp a name…"
                    autoFocus
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 14,
                      backgroundColor: '#FFFFFF', border: '1.5px solid #E7E1D5',
                      color: '#1E1E1C', fontSize: 16, outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSave() }}
                  />
                </div>

                {/* Location */}
                {location?.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 12,
                      backgroundColor: '#F3EFE6', border: '1px solid #E7E1D5',
                    }}
                  >
                    <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
                      <path d="M5.5 0C3.0 0 1 2.0 1 4.5C1 8.0 5.5 14 5.5 14C5.5 14 10 8.0 10 4.5C10 2.0 8.0 0 5.5 0Z" fill="#6B6B67" />
                      <circle cx="5.5" cy="4.5" r="1.8" fill="#F3EFE6" />
                    </svg>
                    <span style={{ fontSize: 13, color: '#6B6B67', fontWeight: 500 }}>
                      {location.label}
                    </span>
                  </motion.div>
                )}

                {/* Collection */}
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
                  <p style={{ fontSize: 12, color: '#6B6B67', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                    Collection
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCollectionPickerOpen(true)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 14,
                      backgroundColor: '#FFFFFF', border: '1.5px solid #E7E1D5',
                      cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                          <path d="M1.5 4.5C1.5 3.67 2.17 3 3 3H6L7.5 5H12C12.83 5 13.5 5.67 13.5 6.5V11.5C13.5 12.33 12.83 13 12 13H3C2.17 13 1.5 12.33 1.5 11.5V4.5Z" stroke="#6B6B67" strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#1E1E1C' }}>
                        {collections.find(c => c.id === selectedCollectionId)?.name ?? 'All Stamps'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 13, color: '#6B6B67', fontWeight: 500 }}>Change</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 3L9 7L5 11" stroke="#6B6B67" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>

            {/* Save */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              style={{ padding: '0 24px', paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!title.trim()}
                style={{
                  width: '100%', padding: '16px', borderRadius: 50,
                  backgroundColor: title.trim() ? '#1E1E1C' : '#E7E1D5',
                  border: 'none', color: title.trim() ? '#F7F4ED' : '#6B6B67',
                  fontSize: 16, fontWeight: 700,
                  cursor: title.trim() ? 'pointer' : 'default',
                  letterSpacing: '-0.2px', WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.25s, color 0.25s',
                  fontFamily: 'inherit',
                }}
              >
                Save Stamp
              </motion.button>
            </motion.div>

            <CollectionPickerSheet
              visible={collectionPickerOpen}
              onClose={() => setCollectionPickerOpen(false)}
              collections={collections}
              currentCollectionId={selectedCollectionId}
              onSelect={(id) => setSelectedCollectionId(id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

// ── Small icon button (light bg, for device stage) ───────
function SmallButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(30,30,28,0.07)', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        color: 'var(--text-primary)', flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  )
}

// ── Glass circle button (dark bg overlay, for adjust stage) ──
function GlassButton({ onClick, children, size = 40 }: { onClick?: () => void; children: React.ReactNode; size?: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.16)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  )
}

