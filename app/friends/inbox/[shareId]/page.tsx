'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import StampShape from '@/components/StampShape'
import { getShareById, markShareSeen, type SharedStampRecord } from '@/lib/sharing-db'

const SW = 230
const SH = 290

function relativeDate(iso: string): string {
  const d    = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'à l\'instant'
  if (mins < 60)  return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  if (days < 7)   return `il y a ${days} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function ShareDetailPage() {
  const router = useRouter()
  const params = useParams()
  const shareId = params?.shareId as string
  const { user } = useStore()

  const [share,   setShare]   = useState<SharedStampRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !shareId) return
    getShareById(shareId, user.id).then((data) => {
      setShare(data)
      setLoading(false)
      if (data && !data.seen) markShareSeen(shareId)
    })
  }, [user, shareId])

  const senderName = share
    ? (share.senderUsername || share.senderFullName || 'Un ami')
    : '—'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', transition: 'background-color 0.25s ease' }}>

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
          Stamp partagé
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: 20 }}>
          <div style={{ width: SW, height: SH, borderRadius: 24, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 24, width: 180, borderRadius: 8, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 14, width: 130, borderRadius: 6, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
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
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 24px 48px', gap: 0 }}
        >
          {/* Stamp shape */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.06 }}
            style={{ marginBottom: 28 }}
          >
            <StampShape
              imageUrl={share.stampImageUrl ?? share.stampThumbnailUrl ?? ''}
              alt={share.stampTitle ?? 'Stamp'}
              width={SW}
              height={SH}
              dominantColor={share.stampDominantColor ?? undefined}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontSize: 26, fontWeight: 700, color: 'var(--text-primary)',
              margin: '0 0 8px', letterSpacing: '-0.5px', textAlign: 'center',
              transition: 'color 0.25s ease',
            }}
          >
            {share.stampTitle ?? 'Stamp sans titre'}
          </motion.h1>

          {/* Sender info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2L9 13.5L7 9L2.5 7L14 2Z" />
              </svg>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.25s ease' }}>
                De <strong style={{ color: 'var(--text-primary)' }}>{senderName}</strong>
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}>
              {relativeDate(share.createdAt)}
            </span>
          </motion.div>

          {/* Message */}
          {share.message && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              style={{
                width: '100%', maxWidth: 340,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16, padding: '14px 18px',
                transition: 'background-color 0.25s ease, border-color 0.25s ease',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Message
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5, transition: 'color 0.25s ease' }}>
                {share.message}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
