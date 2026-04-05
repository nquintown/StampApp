'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import { getReceivedShares, markAllSharesSeen, type SharedStampRecord } from '@/lib/sharing-db'

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'à l\'instant'
  if (mins < 60)  return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

export default function InboxPage() {
  const router = useRouter()
  const { user } = useStore()

  const [shares,  setShares]  = useState<SharedStampRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getReceivedShares(user.id).then((data) => {
      setShares(data)
      setLoading(false)
      // Mark all as seen
      markAllSharesSeen(user.id)
    })
  }, [user])

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
          Reçus
        </span>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div style={{ padding: '0 20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: 'var(--surface2)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: '60%', borderRadius: 7, backgroundColor: 'var(--surface2)', marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ height: 11, width: '40%', borderRadius: 7, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : shares.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '80px 40px', gap: 14, textAlign: 'center',
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', transition: 'color 0.25s ease' }}>
              Aucun stamp reçu
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, transition: 'color 0.25s ease' }}>
              Quand un ami te partage un stamp,{'\n'}il apparaîtra ici
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          style={{ padding: '0 20px' }}
        >
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 18,
            border: '1px solid var(--border)', overflow: 'hidden',
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          }}>
            {shares.map((share, i) => {
              const senderName = share.senderUsername || share.senderFullName || 'Quelqu\'un'
              return (
                <motion.button
                  key={share.id}
                  whileTap={{ backgroundColor: 'var(--surface2)' }}
                  onClick={() => router.push(`/friends/inbox/${share.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', padding: '14px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < shares.length - 1 ? '1px solid var(--border)' : 'none',
                    textAlign: 'left', fontFamily: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Stamp thumbnail */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, overflow: 'hidden',
                    backgroundColor: share.stampDominantColor ?? 'var(--surface2)',
                    flexShrink: 0,
                  }}>
                    {share.stampThumbnailUrl && (
                      <img
                        src={share.stampThumbnailUrl}
                        alt={share.stampTitle ?? 'Stamp'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      margin: '0 0 2px',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      transition: 'color 0.25s ease',
                    }}>
                      {senderName}
                    </p>
                    <p style={{
                      fontSize: 13, color: 'var(--text-secondary)', margin: 0,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      transition: 'color 0.25s ease',
                    }}>
                      a partagé "{share.stampTitle ?? 'un stamp'}" · {relativeDate(share.createdAt)}
                    </p>
                  </div>

                  {/* Unseen dot */}
                  {!share.seen && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: '#10B981', flexShrink: 0,
                    }} />
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
