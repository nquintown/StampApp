'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { Collection, Stamp } from '@/lib/types'

interface CollectionCardProps {
  collection: Collection
  stamps: Stamp[]
  onClick?: () => void
  onStampClick?: (stampId: string) => void
}

export default function CollectionCard({
  collection,
  stamps,
  onClick,
  onStampClick,
}: CollectionCardProps) {
  const previewStamps = collection.coverStampIds
    .slice(0, 4)
    .map((id) => stamps.find((s) => s.id === id))
    .filter(Boolean) as Stamp[]

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 20,
        padding: '16px 18px',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.2px',
              transition: 'color 0.25s ease',
            }}
          >
            {collection.name}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              margin: '2px 0 0 0',
              transition: 'color 0.25s ease',
            }}
          >
            {collection.stampCount} {collection.stampCount === 1 ? 'stamp' : 'stamps'}
          </p>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'background-color 0.25s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Stamp previews row */}
      {previewStamps.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {previewStamps.map((stamp, i) => (
            <MiniStampPreview
              key={stamp.id}
              stamp={stamp}
              index={i}
              onClick={
                onStampClick
                  ? (e) => {
                      e.stopPropagation()
                      onStampClick(stamp.id)
                    }
                  : undefined
              }
            />
          ))}
          {collection.stampCount > 4 && (
            <div
              style={{
                width: 52,
                height: 64,
                borderRadius: 8,
                backgroundColor: 'var(--surface2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                transition: 'background-color 0.25s ease',
              }}
            >
              +{collection.stampCount - 4}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function MiniStampPreview({
  stamp,
  index,
  onClick,
}: {
  stamp: Stamp
  index: number
  onClick?: (e: React.MouseEvent) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={onClick ? { scale: 0.92 } : undefined}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      onClick={onClick}
      style={{
        position: 'relative',
        width: 52,
        height: 64,
        flexShrink: 0,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        border: '1.5px solid var(--surface)',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        transition: 'border-color 0.25s ease',
      }}
    >
      {/* Perforated edge top */}
      <div
        style={{
          position: 'absolute',
          top: -4,
          left: 0,
          right: 0,
          height: 8,
          backgroundImage: 'radial-gradient(circle, var(--surface) 3px, transparent 3px)',
          backgroundSize: '10px 8px',
          backgroundPosition: '5px 0',
          zIndex: 2,
        }}
      />
      {/* Perforated edge bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: 0,
          right: 0,
          height: 8,
          backgroundImage: 'radial-gradient(circle, var(--surface) 3px, transparent 3px)',
          backgroundSize: '10px 8px',
          backgroundPosition: '5px 0',
          zIndex: 2,
        }}
      />
      <img
        src={stamp.thumbnailUrl}
        alt={stamp.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        loading="lazy"
      />
    </motion.div>
  )
}
