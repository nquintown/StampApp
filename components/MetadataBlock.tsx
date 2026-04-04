'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { StampLocation } from '@/lib/types'

interface MetadataBlockProps {
  createdAt: string
  sourceLabel?: string
  sourceType?: string
  tags?: string[]
  location?: StampLocation
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function MetadataBlock({
  createdAt,
  sourceLabel,
  sourceType,
  tags,
  location,
}: MetadataBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px' }}
    >
      {/* Date and time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <MetaItem icon={<CalendarIcon />} label={formatDate(createdAt)} />
        <MetaItem icon={<ClockIcon />} label={formatTime(createdAt)} />
      </div>

      {/* Location */}
      {location?.label && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
        >
          <MetaItem
            icon={<PinIcon />}
            label={location.label}
            accent
          />
        </motion.div>
      )}

      {/* Source badge */}
      {sourceLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SourceIcon type={sourceType} />
          <span style={{ fontSize: 13, color: '#6B6B67' }}>{sourceLabel}</span>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12, fontWeight: 500, color: '#6B6B67',
                backgroundColor: '#F3EFE6', borderRadius: 20, padding: '3px 10px',
                border: '1px solid #E7E1D5',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Sub-components ───────────────────────────────────────
function MetaItem({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: accent ? '#1E1E1C' : '#6B6B67', flexShrink: 0, display: 'flex' }}>
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: accent ? 600 : 500, color: accent ? '#1E1E1C' : '#6B6B67' }}>
        {label}
      </span>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 1.5V3.5M9.5 1.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M1.5 5.5H12.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <path
        d="M6 0C3.24 0 1 2.24 1 5C1 8.75 6 14 6 14C6 14 11 8.75 11 5C11 2.24 8.76 0 6 0Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M6 0C3.24 0 1 2.24 1 5C1 8.75 6 14 6 14C6 14 11 8.75 11 5C11 2.24 8.76 0 6 0Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="6" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function SourceIcon({ type }: { type?: string }) {
  if (type === 'camera') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" color="#6B6B67">
        <path
          d="M1.5 4.5H2.5L3.5 2.5H10.5L11.5 4.5H12.5C12.5 4.5 13 4.5 13 5V11C13 11.5 12.5 12 12 12H2C1.5 12 1 11.5 1 11V5C1 4.5 1.5 4.5 1.5 4.5Z"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        />
        <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" color="#6B6B67">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 5H9.5M4.5 7.5H9.5M4.5 10H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
