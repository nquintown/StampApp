'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import StampShape, { generateStampPath } from '@/components/StampShape'
import TagChip from '@/components/TagChip'
import { getShareById, markShareSeen, type SharedStampRecord } from '@/lib/sharing-db'

// ── Stamp dimensions — identical to stamp detail page ─────
const SW         = 230
const SH         = 290
const SR         = Math.max(4, Math.min(16, Math.round(Math.min(SW, SH) * 0.034)))
const STAMP_PATH = generateStampPath(SW, SH, SR)

// ── Info card components — identical to stamp detail page ─
function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--surface)',
      borderRadius: 20,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value, isLast = false }: {
  icon: React.ReactNode; label: string; value: string; isLast?: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: 'var(--text-secondary)',
          transition: 'background-color 0.25s ease',
        }}>
          {icon}
        </div>
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
            letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 2px',
            transition: 'color 0.25s ease',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: 16, fontWeight: 500, color: 'var(--text-primary)',
            margin: 0, transition: 'color 0.25s ease',
          }}>
            {value}
          </p>
        </div>
      </div>
      {!isLast && <div style={{ height: 1, backgroundColor: 'var(--border)', marginLeft: 68, transition: 'background-color 0.25s ease' }} />}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function ShareDetailPage() {
  const router   = useRouter()
  const params   = useParams()
  const shareId  = params?.shareId as string
  const { user } = useStore()

  const [share,   setShare]   = useState<SharedStampRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // 3D parallax refs — exactly as stamp detail page
  const containerRef = useRef<HTMLDivElement>(null)
  const tiltRef      = useRef<HTMLDivElement>(null)
  const shineRef     = useRef<HTMLDivElement>(null)
  const shadowRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !shareId) return
    getShareById(shareId, user.id).then((data) => {
      setShare(data)
      setLoading(false)
      if (data && !data.seen) markShareSeen(shareId)
    })
  }, [user, shareId])

  // ── 3D parallax — exact copy from stamp detail page ──────
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target  = { rx: 0, ry: 0 }
    const current = { rx: 0, ry: 0 }
    const vel     = { rx: 0, ry: 0 }
    const STIFF   = 0.052
    const DAMP    = 0.80

    let raf: number
    let usingGyro     = false
    let introDisabled = false
    let startTime: number | null = null
    const INTRO_MS = 2600

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

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

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime

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

  const senderName = share
    ? (share.senderUsername
        || share.senderFullName
        || (share.senderEmail ? share.senderEmail.split('@')[0] : null)
        || 'Un ami')
    : '—'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 48, transition: 'background-color 0.25s ease' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
        position: 'sticky', top: 0,
        backgroundColor: 'var(--bg)', zIndex: 50,
        transition: 'background-color 0.25s ease',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Stamp reçu
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: 20 }}>
          <div style={{ width: SW, height: SH, borderRadius: 24, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 28, width: 200, borderRadius: 8, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ width: '100%', maxWidth: 360, height: 110, borderRadius: 20, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ) : !share ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>Stamp introuvable</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.back()}
            style={{
              padding: '10px 20px', borderRadius: 12,
              backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
              border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            Retour
          </motion.button>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 24px 48px', gap: 0,
        }}>
          {/* ── Stamp with 3D parallax — exact copy from stamp detail ── */}
          <div
            ref={containerRef}
            style={{ position: 'relative', marginBottom: 24, display: 'flex', justifyContent: 'center' }}
          >
            {/* Parallax shadow */}
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
              {/* Tilt container */}
              <div ref={tiltRef} style={{ display: 'inline-block', willChange: 'transform' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.86, y: 28 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <StampShape
                    imageUrl={share.stampThumbnailUrl ?? share.stampImageUrl ?? ''}
                    alt={share.stampTitle ?? 'Stamp'}
                    width={SW}
                    height={SH}
                    dominantColor={share.stampDominantColor ?? undefined}
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

          {/* Title + tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.38 }}
            style={{ textAlign: 'center', marginBottom: 28, width: '100%' }}
          >
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: 'var(--text-primary)',
              margin: '0 0 4px', letterSpacing: '-0.5px',
              transition: 'color 0.25s ease',
            }}>
              {share.stampTitle ?? 'Stamp sans titre'}
            </h1>
            {share.stampTags && share.stampTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.3 }}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}
              >
                {share.stampTags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Info cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Date + Time */}
            {share.stampCreatedAt && (
              <InfoCard>
                <InfoRow
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
                  label="Date"
                  value={formatDate(share.stampCreatedAt)}
                />
                <InfoRow
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
                  label="Heure"
                  value={formatTime(share.stampCreatedAt)}
                  isLast
                />
              </InfoCard>
            )}

            {/* Location */}
            {share.stampLocation && (
              <InfoCard>
                <InfoRow
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.75-7-11a7 7 0 1 1 14 0c0 4.25-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>}
                  label="Lieu"
                  value={share.stampLocation}
                  isLast
                />
              </InfoCard>
            )}

            {/* Sender + message */}
            <InfoCard>
              <InfoRow
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2L9 13.5L7 9L2.5 7L14 2Z"/></svg>}
                label="Envoyé par"
                value={senderName}
                isLast={!share.message}
              />
              {share.message && (
                <InfoRow
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                  label="Message"
                  value={share.message}
                  isLast
                />
              )}
            </InfoCard>
          </motion.div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
