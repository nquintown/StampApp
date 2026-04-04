'use client'

import React, { useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateStampPath } from './StampShape'
import type { PhotoTransform } from '@/lib/types'

interface StampImagePreviewProps {
  visible: boolean
  onClose: () => void
  imageUrl: string
  thumbnailUrl?: string
  alt?: string
  stampWidth?: number
  stampHeight?: number
  photoTransform?: PhotoTransform   // saved pan/zoom/rotate from cut stage
}

export default function StampImagePreview({
  visible,
  onClose,
  imageUrl,
  thumbnailUrl,
  alt = 'Stamp',
  stampWidth = 230,
  stampHeight = 290,
  photoTransform,
}: StampImagePreviewProps) {
  const uid      = useId().replace(/:/g, '')
  const filterId = `preview-glow-${uid}`

  // The image shown inside the stamp window — use the crop thumbnail if available,
  // otherwise fall back to the full-frame image
  const windowSrc = thumbnailUrl ?? imageUrl

  const r    = Math.max(4, Math.min(16, Math.round(Math.min(stampWidth, stampHeight) * 0.034)))
  const path = generateStampPath(stampWidth, stampHeight, r)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* ── Full original image — reproduced with the saved cut transform ── */}
          <motion.img
            src={imageUrl}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              transformOrigin: 'center center',
              transform: photoTransform
                ? `translate(${photoTransform.x}px, ${photoTransform.y}px) rotate(${photoTransform.rotation}deg) scale(${photoTransform.scale})`
                : undefined,
            }}
          />

          {/* ── Dark veil outside the stamp area ── */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            pointerEvents: 'none',
          }} />

          {/* ── Stamp outline with glow — centered ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.06 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <svg
              width={stampWidth}
              height={stampHeight}
              viewBox={`0 0 ${stampWidth} ${stampHeight}`}
              style={{ overflow: 'visible' }}
            >
              <defs>
                <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Soft glow spread */}
              <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="8"
                filter={`url(#${filterId})`}
              />

              {/* Sharp white outline */}
              <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.8"
              />
            </svg>
          </motion.div>

          {/* ── Clear window: stamp content inside the outline ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.06 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: stampWidth,
              height: stampHeight,
              clipPath: `path('${path}')`,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* When we have a dedicated thumbnail (camera stamps), show it
                  perfectly filling the stamp window so it matches what the user sees
                  in their collection. For gallery stamps, fall back to the full frame. */}
              <img
                src={windowSrc}
                alt=""
                aria-hidden
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            </div>
          </motion.div>

          {/* ── Tap to close hint ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 'max(36px, env(safe-area-inset-bottom, 36px))',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.04em',
            }}>
              Tap anywhere to close
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
