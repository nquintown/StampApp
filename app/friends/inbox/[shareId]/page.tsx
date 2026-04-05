'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import StampShape, { generateStampPath } from '@/components/StampShape'
import StampImagePreview from '@/components/StampImagePreview'
import { getShareById, markShareSeen, type SharedStampRecord } from '@/lib/sharing-db'

const SW         = 230
const SH         = 290
const SR         = Math.max(4, Math.min(16, Math.round(Math.min(SW, SH) * 0.034)))
const STAMP_PATH = generateStampPath(SW, SH, SR)

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

function InfoRow({
  icon, label, value, isLast = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isLast?: boolean
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

  const [share,        setShare]        = useState<SharedStampRecord | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [previewOpen,  setPreviewOpen]  = useState(false)

  // 3D tilt refs
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

  // 3D parallax — same as stamp detail page
  useEffect(() => {
    if (!share) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target  = { rx: 0, ry: 0 }
    const current = { rx: 0, ry: 0 }
    const vel     = { rx: 0, ry: 0 }
    const STIFF   = 0.052
    const DAMP    = 0.80
    let raf = 0
    const animate = () => {
      vel.rx = vel.rx * DAMP + (target.rx - current.rx) * STIFF
      vel.ry = vel.ry * DAMP + (target.ry - current.ry) * STIFF
      current.rx += vel.rx
      current.ry += vel.ry
      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(900px) rotateX(${current.rx}deg) rotateY(${current.ry}deg)`
      }
      if (shineRef.current) {
        const norm = Math.sqrt(current.rx ** 2 + current.ry ** 2) / 20
        shineRef.current.style.opacity = String(norm * 0.38)
        shineRef.current.style.background =
          `radial-gradient(circle at ${50 - current.ry * 2}% ${50 - current.rx * 2}%, rgba(255,255,255,0.9) 0%, transparent 70%)`
      }
      if (shadowRef.current) {
        const depth = Math.sqrt(current.rx ** 2 + current.ry ** 2) / 15
        shadowRef.current.style.transform = `translate(${current.ry * 1.8}px, ${current.rx * 1.8}px)`
        shadowRef.current.style.opacity   = String(0.18 + depth * 0.25)
        shadowRef.current.style.filter    = `blur(${12 + depth * 10}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    const el = containerRef.current
    const onMove = (e: TouchEvent | MouseEvent) => {
      const rect = el?.getBoundingClientRect()
      if (!rect) return
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top
      const nx = (x / rect.width  - 0.5) * 2
      const ny = (y / rect.height - 0.5) * 2
      target.rx = -ny * 14
      target.ry =  nx * 14
    }
    const onLeave = () => { target.rx = 0; target.ry = 0 }
    el?.addEventListener('mousemove', onMove)
    el?.addEventListener('touchmove', onMove, { passive: true })
    el?.addEventListener('mouseleave', onLeave)
    el?.addEventListener('touchend', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el?.removeEventListener('mousemove', onMove)
      el?.removeEventListener('touchmove', onMove)
      el?.removeEventListener('mouseleave', onLeave)
      el?.removeEventListener('touchend', onLeave)
    }
  }, [share])

  const senderName = share
    ? (share.senderUsername || share.senderFullName || 'Un ami')
    : '—'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 48, transition: 'background-color 0.25s ease' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px', transition: 'color 0.25s ease' }}>
          Stamp reçu
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        /* Skeleton */
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px 0', gap: 20 }}
        >
          {/* ── Stamp image with 3D tilt ─────────────────── */}
          <div
            ref={containerRef}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
          >
            {/* Shadow */}
            <div
              ref={shadowRef}
              style={{
                position: 'absolute', inset: 0,
                background: share.stampDominantColor ?? 'rgba(0,0,0,0.4)',
                borderRadius: 20, filter: 'blur(18px)', opacity: 0.18,
                zIndex: 0, transition: 'opacity 0.3s ease',
              }}
            />

            {/* Stamp */}
            <div ref={tiltRef} style={{ position: 'relative', zIndex: 1, willChange: 'transform' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.06 }}
                onClick={() => setPreviewOpen(true)}
                style={{ cursor: 'zoom-in', position: 'relative' }}
              >
                <StampShape
                  imageUrl={share.stampImageUrl ?? share.stampThumbnailUrl ?? ''}
                  alt={share.stampTitle ?? 'Stamp'}
                  width={SW}
                  height={SH}
                  dominantColor={share.stampDominantColor ?? undefined}
                />
                {/* Shine */}
                <div
                  ref={shineRef}
                  style={{
                    position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none',
                    WebkitMaskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}'><path d='${STAMP_PATH}' fill='white'/></svg>")`,
                    maskImage:       `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}'><path d='${STAMP_PATH}' fill='white'/></svg>")`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* ── Title ──────────────────────────────────────── */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            style={{
              fontSize: 26, fontWeight: 700, color: 'var(--text-primary)',
              margin: 0, letterSpacing: '-0.5px', textAlign: 'center',
              transition: 'color 0.25s ease',
            }}
          >
            {share.stampTitle ?? 'Stamp sans titre'}
          </motion.h1>

          {/* ── Info cards ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

            {/* Sender */}
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
        </motion.div>
      )}

      {/* Full-screen image preview */}
      {share && (
        <StampImagePreview
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          imageUrl={share.stampImageUrl ?? share.stampThumbnailUrl ?? ''}
          alt={share.stampTitle ?? ''}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
