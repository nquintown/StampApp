'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import StampShape, { generateStampPath } from '@/components/StampShape'
import { IconButton } from '@/components/TopBar'

// ── Stamp card dimensions (stable, computed once) ─────────────
const SW          = 230
const SH          = 290
const SR          = Math.max(4, Math.min(16, Math.round(Math.min(SW, SH) * 0.034)))
const STAMP_PATH  = generateStampPath(SW, SH, SR)
import ContextMenuSheet from '@/components/ContextMenuSheet'
import CollectionPickerSheet from '@/components/CollectionPickerSheet'
import StampImagePreview from '@/components/StampImagePreview'
import TagChip from '@/components/TagChip'
import FriendPickerSheet from '@/components/FriendPickerSheet'
import RenameSheet from '@/components/RenameSheet'

export default function StampDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { stamps, collections, deleteStamp, moveToCollection, toggleFavorite, renameStamp, user } = useStore()

  const [menuOpen, setMenuOpen]               = useState(false)
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false)
  const [isDeleting, setIsDeleting]           = useState(false)
  const [previewOpen, setPreviewOpen]         = useState(false)
  const [shareOpen, setShareOpen]             = useState(false)
  const [renameOpen, setRenameOpen]           = useState(false)

  // ── 3D parallax tilt — refs (DOM updated directly, zero re-renders) ──
  const containerRef = useRef<HTMLDivElement>(null)
  const tiltRef      = useRef<HTMLDivElement>(null)
  const shineRef     = useRef<HTMLDivElement>(null)
  const shadowRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target  = { rx: 0, ry: 0 }
    const current = { rx: 0, ry: 0 }
    const vel     = { rx: 0, ry: 0 }
    // Spring: STIFF = pull strength, DAMP = friction (higher = less bounce)
    const STIFF   = 0.052
    const DAMP    = 0.80

    let raf: number
    let usingGyro    = false
    let introDisabled = false   // set to true once real input arrives
    let startTime: number | null = null
    const INTRO_MS = 2600       // auto-tilt demo duration

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

    // Apply computed values directly to DOM (no React state → no re-render)
    const applyDOM = () => {
      const { rx, ry } = current

      if (tiltRef.current) {
        tiltRef.current.style.transform =
          `rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
      }

      if (shineRef.current) {
        const mag       = Math.sqrt(rx * rx + ry * ry)
        const intensity = Math.min(0.38, mag * 0.024)
        const sx        = (50 + ry * 2.2).toFixed(1)
        const sy        = (50 - rx * 2.2).toFixed(1)
        const angle     = (Math.atan2(ry, rx) * 180 / Math.PI).toFixed(1)
        shineRef.current.style.background = [
          `radial-gradient(ellipse 65% 55% at ${sx}% ${sy}%,`,
          ` rgba(255,255,255,${intensity.toFixed(3)}) 0%,`,
          ` rgba(255,255,255,${(intensity * 0.25).toFixed(3)}) 50%,`,
          ` transparent 100%),`,
          `linear-gradient(${angle}deg,`,
          ` transparent 38%, rgba(255,255,255,0.055) 50%, transparent 62%)`,
        ].join('')
      }

      if (shadowRef.current) {
        const mag = Math.sqrt(rx * rx + ry * ry)
        shadowRef.current.style.transform = `translate(${(ry * 2.8).toFixed(1)}px, ${(-rx * 2.8).toFixed(1)}px) scale(${(1 + mag * 0.018).toFixed(3)})`
        shadowRef.current.style.filter    = `blur(${(18 + mag * 1.4).toFixed(1)}px)`
        shadowRef.current.style.opacity   = (0.38 + mag * 0.022).toFixed(3)
      }
    }

    // Spring physics tick (receives rAF timestamp for intro timing)
    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime

      // Auto-tilt intro: figure-8 motion that fades out, disabled once real input arrives
      if (elapsed < INTRO_MS && !introDisabled) {
        const t    = elapsed / INTRO_MS
        const fade = 1 - t
        target.ry = Math.sin(t * Math.PI * 2.5) * 13 * fade
        target.rx = Math.sin(t * Math.PI * 1.7 + 1.0) * 8 * fade
      }

      vel.rx = vel.rx * DAMP + (target.rx - current.rx) * STIFF
      vel.ry = vel.ry * DAMP + (target.ry - current.ry) * STIFF
      current.rx += vel.rx
      current.ry += vel.ry
      applyDOM()
      raf = requestAnimationFrame(tick)
    }

    // ── Gyroscope input ─────────────────────────────────────
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return
      usingGyro = true
      introDisabled = true
      target.ry = clamp((e.gamma ?? 0) * 0.44, -18, 18)
      target.rx = clamp(-((e.beta  ?? 50) - 50) * 0.44, -18, 18)
    }

    const startGyro = () => {
      window.addEventListener('deviceorientation', onOrientation, true)
    }

    // ── Mouse input (desktop fallback) ──────────────────────
    const onMouseMove = (e: MouseEvent) => {
      if (usingGyro) return
      introDisabled = true
      const el = containerRef.current
      if (!el) return
      const r  = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)
      const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
      target.ry = clamp(dx * 16, -16, 16)
      target.rx = clamp(-dy * 16, -16, 16)
    }

    const onMouseLeave = () => {
      if (usingGyro) return
      target.rx = 0
      target.ry = 0
    }

    // ── Gyroscope startup ────────────────────────────────────
    // preGrantGyroPermission() was already called in the navigation handler
    // of the previous page (home / collection / grid) — which ran inside the
    // user gesture of the tap. So by the time we arrive here, iOS has already
    // stored the grant and requestPermission() resolves to 'granted' instantly,
    // even outside a gesture. Android / desktop never need permission.
    if (typeof DeviceOrientationEvent !== 'undefined') {
      const reqPerm = (DeviceOrientationEvent as any).requestPermission
      if (typeof reqPerm === 'function') {
        reqPerm()
          .then((state: string) => { if (state === 'granted') startGyro() })
          .catch(() => {})
      } else {
        startGyro()
      }
    }

    const el = containerRef.current
    el?.addEventListener('mousemove', onMouseMove)
    el?.addEventListener('mouseleave', onMouseLeave)

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('deviceorientation', onOrientation, true)
      el?.removeEventListener('mousemove', onMouseMove)
      el?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stamp = stamps.find((s) => s.id === id)
  const currentCollection = collections.find((c) => c.id === stamp?.collectionId)

  if (!stamp) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12,
      }}>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Stamp introuvable</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          style={{
            padding: '10px 20px', borderRadius: 12,
            backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retour
        </motion.button>
      </div>
    )
  }

  const handleDelete = () => {
    setIsDeleting(true)
    setTimeout(() => { deleteStamp(stamp.id); router.back() }, 320)
  }

  const menuItems = [
    {
      label: 'Renommer',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 12.5V15h2.5l7.37-7.37-2.5-2.5L3 12.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M12.88 4.12a1.77 1.77 0 0 1 2.5 2.5l-1.25-1.25-1.25-1.25Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
      noAutoClose: true,
      onPress: () => { setMenuOpen(false); setTimeout(() => setRenameOpen(true), 220) },
    },
    {
      label: 'Partager',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12 3L16 7L12 11V8.5C7 8.5 4 10.5 3 15C2.5 11 4 6 12 5.5V3Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
      noAutoClose: true,
      onPress: () => { setMenuOpen(false); setTimeout(() => setShareOpen(true), 200) },
    },
    {
      label: stamp.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 15.5L2.5 9C1.5 8 1.5 6.5 2.5 5.5C3.5 4.5 5 4.5 6 5.5L9 8.5L12 5.5C13 4.5 14.5 4.5 15.5 5.5C16.5 6.5 16.5 8 15.5 9L9 15.5Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
            fill={stamp.favorite ? 'currentColor' : 'none'}
          />
        </svg>
      ),
      onPress: () => toggleFavorite(stamp.id),
    },
    {
      label: 'Déplacer',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M2 5.5C2 4.67 2.67 4 3.5 4H7L8.5 6H14.5C15.33 6 16 6.67 16 7.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V5.5Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
          />
        </svg>
      ),
      noAutoClose: true,
      onPress: () => { setMenuOpen(false); setTimeout(() => setCollectionPickerOpen(true), 200) },
    },
    {
      label: 'Supprimer',
      destructive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 5H15M7 5V3H11V5M6 5V14C6 14.5 6.5 15 7 15H11C11.5 15 12 14.5 12 14V5H6Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onPress: handleDelete,
    },
  ]


  return (
    <AnimatePresence>
      <motion.div
        key={stamp.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: isDeleting ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          position: 'relative',
          transition: 'background-color 0.25s ease',
        }}
      >
        {/* ── Top bar ─────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
          position: 'sticky', top: 0,
          backgroundColor: 'var(--bg)',
          zIndex: 50,
          transition: 'background-color 0.25s ease',
        }}>
          <IconButton label="Retour" onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>

          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            {stamp.sourceLabel || 'Stamp'}
          </motion.span>

          <IconButton label="Options" onClick={() => setMenuOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </IconButton>
        </div>

        {/* ── Main scroll content ──────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 24px 48px', gap: 0,
        }}>
          {/* Stamp — tap to open full image preview */}
          <div
            ref={containerRef}
            style={{ position: 'relative', marginBottom: 24, display: 'flex', justifyContent: 'center' }}
          >
            {/* Parallax shadow — shifts opposite to tilt, creates floating depth illusion */}
            <div
              ref={shadowRef}
              style={{
                position: 'absolute',
                bottom: -28, left: '8%', right: '8%', height: 60,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 72%)',
                pointerEvents: 'none',
                willChange: 'transform, filter, opacity',
                opacity: 0.38,
              }}
            />

            {/* Perspective wrapper */}
            <div style={{ perspective: '700px', perspectiveOrigin: '50% 50%' }}>
              {/* Tilt container — rotateX/Y written directly by rAF */}
              <div ref={tiltRef} style={{ display: 'inline-block', willChange: 'transform' }}>
                <motion.div
                  layoutId={`stamp-card-${stamp.id}`}
                  initial={{ opacity: 0, scale: 0.86, y: 28 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                  onClick={() => setPreviewOpen(true)}
                  whileTap={{ scale: 0.96 }}
                >
                  <StampShape
                    imageUrl={stamp.thumbnailUrl || stamp.imageUrl}
                    alt={stamp.title}
                    width={SW}
                    height={SH}
                    dominantColor={stamp.dominantColor}
                  />
                  {/* Specular shine layer — clipped to stamp shape, updated by rAF */}
                  <div
                    ref={shineRef}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: SW, height: SH,
                      clipPath: `path('${STAMP_PATH}')`,
                      pointerEvents: 'none',
                      willChange: 'background',
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.38 }}
            style={{ textAlign: 'center', marginBottom: 28, width: '100%' }}
          >
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: 'var(--text-primary)',
              margin: '0 0 4px', letterSpacing: '-0.5px',
            }}>
              {stamp.title}
            </h1>
            {stamp.favorite && (
              <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, letterSpacing: '0.04em' }}>
                ♥ Favori
              </span>
            )}
            {/* Colored tags — centered under the title */}
            {stamp.tags && stamp.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.3 }}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}
              >
                {stamp.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── Info cards ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {/* Date & Time block */}
            <InfoCard>
              <InfoRow
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" color="var(--text-secondary)">
                    <rect x="1.5" y="2.5" width="13" height="12" rx="2.5"
                      stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 1.5V3.5M11 1.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M1.5 6H14.5" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                }
                label="Date"
                value={formatDate(stamp.createdAt)}
              />
              <Divider />
              <InfoRow
                icon={
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" color="var(--text-secondary)">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M8 4.5V8L10.5 10" stroke="currentColor" strokeWidth="1.3"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                label="Heure"
                value={formatTime(stamp.createdAt)}
              />
            </InfoCard>

            {/* Location block */}
            {stamp.location?.label ? (
              <InfoCard>
                <InfoRow
                  icon={
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" color="var(--text-secondary)">
                      <path
                        d="M7 0C4.24 0 2 2.24 2 5C2 8.75 7 15 7 15C7 15 12 8.75 12 5C12 2.24 9.76 0 7 0Z"
                        fill="var(--border)"
                        stroke="currentColor" strokeWidth="1.2"
                      />
                      <circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  }
                  label="Lieu"
                  value={stamp.location.label}
                  highlight
                />
              </InfoCard>
            ) : null}

            {/* Collection block */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => setCollectionPickerOpen(true)}
              style={{
                display: 'block', width: '100%',
                backgroundColor: 'var(--surface)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 0,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                textAlign: 'left',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.25s ease',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" color="var(--text-secondary)">
                      <path
                        d="M2 5C2 4.17 2.67 3.5 3.5 3.5H6.5L8 5.5H13C13.83 5.5 14.5 6.17 14.5 7V12C14.5 12.83 13.83 13.5 13 13.5H3C2.17 13.5 1.5 12.83 1.5 12V5Z"
                        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                      Collection
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {currentCollection?.name ?? stamp.collectionId}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Changer</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" color="var(--text-secondary)">
                    <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.button>

          </motion.div>
        </div>

        {/* ── Bottom action bar ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--bg)',
            borderTop: '1px solid var(--border)',
            padding: '12px 24px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            display: 'flex',
            gap: 10,
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          }}
        >
          {/* Favorite */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => toggleFavorite(stamp.id)}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 14,
              backgroundColor: stamp.favorite ? '#FEF2F2' : 'var(--surface)',
              border: stamp.favorite ? '1.5px solid #FECACA' : '1.5px solid var(--border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              WebkitTapHighlightColor: 'transparent',
              transition: 'background-color 0.2s, border-color 0.2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 13.5L2 8C1.1 7.1 1.1 5.7 2 4.8C2.9 3.9 4.3 3.9 5.2 4.8L8 7.6L10.8 4.8C11.7 3.9 13.1 3.9 14 4.8C14.9 5.7 14.9 7.1 14 8L8 13.5Z"
                stroke={stamp.favorite ? '#EF4444' : 'var(--text-secondary)'}
                strokeWidth="1.4"
                fill={stamp.favorite ? '#EF4444' : 'none'}
              />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: stamp.favorite ? '#EF4444' : 'var(--text-secondary)' }}>
              {stamp.favorite ? 'Sauvegardé' : 'Favori'}
            </span>
          </motion.button>

          {/* Envoyer — paper plane */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShareOpen(true)}
            style={{
              width: 50, height: 50, borderRadius: 25, flexShrink: 0,
              backgroundColor: 'var(--text-primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background-color 0.25s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="var(--bg)" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </motion.div>

        {/* ── Sheets ──────────────────────────────────── */}
        <ContextMenuSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          title={stamp.title}
        />

        <CollectionPickerSheet
          visible={collectionPickerOpen}
          onClose={() => setCollectionPickerOpen(false)}
          collections={collections}
          currentCollectionId={stamp.collectionId}
          onSelect={(colId) => moveToCollection(stamp.id, colId)}
        />

        <StampImagePreview
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          imageUrl={stamp.imageUrl}
          thumbnailUrl={stamp.thumbnailUrl}
          alt={stamp.title}
          stampWidth={230}
          stampHeight={290}
          photoTransform={stamp.photoTransform}
        />

        {user && (
          <FriendPickerSheet
            visible={shareOpen}
            onClose={() => setShareOpen(false)}
            stamp={{
              id:            stamp.id,
              title:         stamp.title,
              thumbnailUrl:  stamp.thumbnailUrl,
              imageUrl:      stamp.imageUrl,
              dominantColor: stamp.dominantColor,
              createdAt:     stamp.createdAt,
              location:      stamp.location?.label ?? null,
              tags:          stamp.tags ?? null,
            }}
            userId={user.id}
          />
        )}

        <RenameSheet
          visible={renameOpen}
          onClose={() => setRenameOpen(false)}
          currentName={stamp.title}
          label="stamp"
          onConfirm={(newTitle) => renameStamp(stamp.id, newTitle)}
        />
      </motion.div>
    </AnimatePresence>
  )
}

// ── Helpers ─────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ──────────────────────────────────────
function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      {children}
    </div>
  )
}

function InfoRow({
  icon, label, value, highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '13px 16px', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background-color 0.25s ease',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 1px' }}>
          {label}
        </p>
        <p style={{ fontSize: 15, fontWeight: highlight ? 600 : 500, color: 'var(--text-primary)', margin: 0 }}>
          {value}
        </p>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: 'var(--border)', marginLeft: 60 }} />
}
