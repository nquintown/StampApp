'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TabBar from '@/components/TabBar'
import {
  getJournalEntriesForYear,
  upsertJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from '@/lib/journal-db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayOfYear(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const start = new Date(y, 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Returns 0 (Mon) to 6 (Sun) offset for the first day of month */
function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  // Convert from Sun=0 to Mon=0
  return (day + 6) % 7
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

// ── Botanical SVG icons (8 variants) ─────────────────────────────────────────

function BotanicalIcon({ variant, size = 20 }: { variant: number; size?: number }) {
  const s = size
  const c = s / 2

  const icons = [
    // 0 — Simple 4-petal flower
    <svg key={0} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <ellipse cx="10" cy="5" rx="1.6" ry="2.8" fill="currentColor" opacity="0.85" />
      <ellipse cx="10" cy="15" rx="1.6" ry="2.8" fill="currentColor" opacity="0.85" />
      <ellipse cx="5" cy="10" rx="2.8" ry="1.6" fill="currentColor" opacity="0.85" />
      <ellipse cx="15" cy="10" rx="2.8" ry="1.6" fill="currentColor" opacity="0.85" />
    </svg>,

    // 1 — Leaf
    <svg key={1} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 17C10 17 4 13 4 8C4 5.2 6.2 3 9 3C9.7 3 10.4 3.15 11 3.4C11.6 3.15 12.3 3 13 3C15.8 3 18 5.2 18 8C18 13 10 17 10 17Z"
        fill="currentColor" opacity="0.9" />
      <path d="M10 17V7" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>,

    // 2 — Sprout / seedling
    <svg key={2} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 17V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 13C10 13 7 11 7 8C7 6.3 8.3 5 10 5C11.7 5 13 6.3 13 8C13 11 10 13 10 13Z"
        fill="currentColor" opacity="0.9" />
      <path d="M10 11C10 11 8 9.5 8 8" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
    </svg>,

    // 3 — Daisy 6 petals
    <svg key={3} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.2" fill="currentColor" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x = 10 + Math.cos(rad) * 5
        const y = 10 + Math.sin(rad) * 5
        return <ellipse key={i} cx={x} cy={y}
          rx="1.5" ry="2.4"
          transform={`rotate(${angle}, ${x}, ${y})`}
          fill="currentColor" opacity="0.75" />
      })}
    </svg>,

    // 4 — Star anise / 5-point star
    <svg key={4} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="1.8" fill="currentColor" />
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 10 + Math.cos(rad) * 2
        const y1 = 10 + Math.sin(rad) * 2
        const x2 = 10 + Math.cos(rad) * 7.5
        const y2 = 10 + Math.sin(rad) * 7.5
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      })}
    </svg>,

    // 5 — Clover / trefoil
    <svg key={5} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 16V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="8" r="2.4" fill="currentColor" opacity="0.9" />
      <circle cx="7" cy="11.5" r="2.4" fill="currentColor" opacity="0.9" />
      <circle cx="13" cy="11.5" r="2.4" fill="currentColor" opacity="0.9" />
    </svg>,

    // 6 — Fern branch
    <svg key={6} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 17V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 14C10 14 7 12 6 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 14C10 14 13 12 14 9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 10C10 10 7.5 8.5 7 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 10C10 10 12.5 8.5 13 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>,

    // 7 — Berry cluster
    <svg key={7} width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 16.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 13C8.5 11.5 7 11 6 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M10 13C11.5 11.5 13 11 14 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="10" cy="7.5" r="3" fill="currentColor" opacity="0.9" />
      <circle cx="5.5" cy="11" r="2.3" fill="currentColor" opacity="0.85" />
      <circle cx="14.5" cy="11" r="2.3" fill="currentColor" opacity="0.85" />
      <circle cx="10" cy="7.5" r="1" fill="white" opacity="0.4" />
    </svg>,
  ]

  return icons[variant % 8]
}

// ── YearGrid ──────────────────────────────────────────────────────────────────

interface YearGridProps {
  year: number
  entries: Map<string, JournalEntry>
  today: string
  onDayPress: (dateStr: string, entry: JournalEntry | null) => void
}

function YearGrid({ year, entries, today, onDayPress }: YearGridProps) {
  const todayDate = new Date()
  const todayYear = todayDate.getFullYear()
  const todayMonth = todayDate.getMonth()
  const todayDay = todayDate.getDate()

  return (
    <div style={{ padding: '0 20px', paddingBottom: 140 }}>
      {Array.from({ length: 12 }, (_, monthIdx) => {
        const daysInMonth = getDaysInMonth(year, monthIdx)
        const offset = getFirstDayOffset(year, monthIdx)
        const isCurrentMonth = year === todayYear && monthIdx === todayMonth
        const isPastMonth = year < todayYear || (year === todayYear && monthIdx < todayMonth)

        return (
          <motion.div
            key={monthIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: monthIdx * 0.03, duration: 0.3 }}
            style={{ marginBottom: 28 }}
          >
            {/* Month label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'color 0.25s ease',
              }}>
                {MONTH_NAMES[monthIdx]}
              </h3>
              {/* Entry count */}
              {(() => {
                let count = 0
                for (let d = 1; d <= daysInMonth; d++) {
                  const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  if (entries.has(key)) count++
                }
                return count > 0 ? (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {count} jour{count > 1 ? 's' : ''}
                  </span>
                ) : null
              })()}
            </div>

            {/* Day names header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 3,
              marginBottom: 4,
            }}>
              {DAY_NAMES.map((name, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  letterSpacing: '0.04em',
                }}>
                  {name}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 3,
            }}>
              {/* Empty cells for offset */}
              {Array.from({ length: offset }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1
                const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                const entry = entries.get(dateStr) ?? null
                const isToday = year === todayYear && monthIdx === todayMonth && dayNum === todayDay
                const isFuture = year > todayYear
                  || (year === todayYear && monthIdx > todayMonth)
                  || (year === todayYear && monthIdx === todayMonth && dayNum > todayDay)

                const variant = dayOfYear(dateStr) % 8
                const color = entry?.stampDominantColor ?? 'var(--text-primary)'

                return (
                  <motion.button
                    key={dateStr}
                    whileTap={!isFuture ? { scale: 0.85 } : {}}
                    onClick={() => !isFuture && onDayPress(dateStr, entry)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      backgroundColor: entry
                        ? 'transparent'
                        : isToday
                          ? 'var(--surface2)'
                          : 'transparent',
                      border: isToday && !entry
                        ? '1.5px solid var(--text-primary)'
                        : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFuture ? 'default' : 'pointer',
                      background: 'none',
                      padding: 0,
                      WebkitTapHighlightColor: 'transparent',
                      opacity: isFuture ? 0.2 : 1,
                      transition: 'opacity 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {entry ? (
                      /* Has entry: show botanical icon */
                      <div style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <BotanicalIcon variant={variant} size={18} />
                      </div>
                    ) : isToday ? (
                      /* Today empty: show day number */
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {dayNum}
                      </span>
                    ) : (
                      /* Past/present empty: faint dot */
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: 'var(--border)',
                      }} />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── TodayCard ─────────────────────────────────────────────────────────────────

interface TodayCardProps {
  todayEntry: JournalEntry | null
  onPress: () => void
}

function TodayCard({ todayEntry, onPress }: TodayCardProps) {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      style={{
        width: '100%',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '16px 18px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Thumbnail or prompt icon */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: 'var(--surface2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.25s ease',
      }}>
        {todayEntry?.stampThumbnailUrl ? (
          <img
            src={todayEntry.stampThumbnailUrl}
            alt="stamp"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>
            <BotanicalIcon variant={dayOfYear(todayLocal()) % 8} size={24} />
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: '0 0 2px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Aujourd&apos;hui · {dateCapitalized}
        </p>
        {todayEntry ? (
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.25s ease',
          }}>
            {todayEntry.note || 'Voir le stamp du jour →'}
          </p>
        ) : (
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            transition: 'color 0.25s ease',
          }}>
            Ajouter un stamp du jour ✦
          </p>
        )}
      </div>

      {/* Arrow */}
      <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.button>
  )
}

// ── EntrySheet ─────────────────────────────────────────────────────────────────

interface EntrySheetProps {
  dateStr: string
  entry: JournalEntry | null
  onClose: () => void
  onSave: (entry: JournalEntry) => void
  onDelete: (dateStr: string) => void
}

function EntrySheet({ dateStr, entry, onClose, onSave, onDelete }: EntrySheetProps) {
  const { stamps, user } = useStore()
  const router = useRouter()
  const [selectedStampId, setSelectedStampId] = useState<string | null>(entry?.stampId ?? null)
  const [note, setNote] = useState(entry?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const dateLabel = (() => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  })()
  const dateLabelCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const selectedStamp = stamps.find((s) => s.id === selectedStampId) ?? null

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const saved = await upsertJournalEntry({
        userId: user.id,
        entryDate: dateStr,
        stampId: selectedStampId,
        note: note.trim() || null,
        stampThumbnailUrl: selectedStamp?.thumbnailUrl ?? null,
        stampDominantColor: selectedStamp?.dominantColor ?? null,
      })
      onSave(saved)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteJournalEntry(user.id, dateStr)
      onDelete(dateStr)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  // Close on backdrop tap
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <motion.div
        ref={sheetRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          width: '100%',
          maxWidth: 430,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 env(safe-area-inset-bottom, 20px)',
          maxHeight: '88vh',
          overflowY: 'auto',
          transition: 'background-color 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)' }} />
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Journal
              </p>
              <h2 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {dateLabelCapitalized}
              </h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: 'var(--surface2)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.25s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>

          {/* Stamp picker */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stamp du jour
            </p>
            <div style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}>
              <style>{`.stamp-picker::-webkit-scrollbar { display: none }`}</style>
              {/* "No stamp" option */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedStampId(null)}
                style={{
                  width: 64, height: 64,
                  borderRadius: 16, flexShrink: 0,
                  border: selectedStampId === null
                    ? '2px solid var(--text-primary)'
                    : '1.5px solid var(--border)',
                  backgroundColor: 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color 0.2s ease, background-color 0.25s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </motion.button>

              {stamps.map((stamp) => (
                <motion.button
                  key={stamp.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedStampId(stamp.id)}
                  style={{
                    width: 64, height: 64,
                    borderRadius: 16, flexShrink: 0,
                    overflow: 'hidden',
                    border: selectedStampId === stamp.id
                      ? '2px solid var(--text-primary)'
                      : '1.5px solid var(--border)',
                    cursor: 'pointer',
                    padding: 0,
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: stamp.dominantColor ?? 'var(--surface2)',
                  }}
                >
                  <img
                    src={stamp.thumbnailUrl}
                    alt={stamp.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Note textarea */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Une phrase sur ce jour
            </p>
            <div style={{ position: 'relative' }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                placeholder="Ce que tu retiens de ce jour…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingBottom: 28,
                  borderRadius: 14,
                  border: '1.5px solid var(--border)',
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: 15,
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, background-color 0.25s ease',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--text-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <span style={{
                position: 'absolute', bottom: 10, right: 12,
                fontSize: 11, color: 'var(--text-secondary)',
              }}>
                {note.length}/140
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            {entry && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  height: 50, paddingLeft: 18, paddingRight: 18,
                  borderRadius: 14,
                  backgroundColor: 'var(--surface2)',
                  border: '1.5px solid var(--border)',
                  color: '#EF4444',
                  fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  flexShrink: 0,
                  transition: 'background-color 0.25s ease',
                }}
              >
                {deleting ? '…' : 'Supprimer'}
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || (!selectedStampId && !note.trim())}
              style={{
                flex: 1, height: 50,
                borderRadius: 14,
                backgroundColor: saving || (!selectedStampId && !note.trim())
                  ? 'var(--surface2)'
                  : 'var(--text-primary)',
                color: saving || (!selectedStampId && !note.trim())
                  ? 'var(--text-secondary)'
                  : 'var(--bg)',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700,
                cursor: saving || (!selectedStampId && !note.trim()) ? 'default' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.25s ease, color 0.25s ease',
              }}
            >
              {saving ? 'Enregistrement…' : entry ? 'Mettre à jour' : 'Enregistrer'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { user } = useStore()
  const [year] = useState(() => new Date().getFullYear())
  const [entries, setEntries] = useState<Map<string, JournalEntry>>(new Map())
  const [loading, setLoading] = useState(true)
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const today = todayLocal()

  // Load entries for current year
  useEffect(() => {
    if (!user) return
    getJournalEntriesForYear(user.id, year)
      .then((data) => {
        const map = new Map<string, JournalEntry>()
        for (const e of data) map.set(e.entryDate, e)
        setEntries(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, year])

  const todayEntry = entries.get(today) ?? null

  const handleDayPress = useCallback((dateStr: string, _entry: JournalEntry | null) => {
    setSheetDate(dateStr)
  }, [])

  const handleSave = useCallback((saved: JournalEntry) => {
    setEntries((prev) => {
      const next = new Map(prev)
      next.set(saved.entryDate, saved)
      return next
    })
  }, [])

  const handleDelete = useCallback((dateStr: string) => {
    setEntries((prev) => {
      const next = new Map(prev)
      next.delete(dateStr)
      return next
    })
  }, [])

  const totalEntries = entries.size
  const progress = Math.round((totalEntries / 365) * 100)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.25s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '56px 20px 20px',
        backgroundColor: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        transition: 'background-color 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
            }}>
              Journal {year}
            </h1>
            {!loading && (
              <p style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}>
                {totalEntries} jour{totalEntries !== 1 ? 's' : ''} · {progress}% de l&apos;année
              </p>
            )}
          </div>
          {/* Progress ring */}
          {!loading && (
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke="var(--text-primary)" strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {progress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Today card */}
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div style={{
              height: 84, borderRadius: 20,
              backgroundColor: 'var(--surface2)',
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
          ) : (
            <TodayCard
              todayEntry={todayEntry}
              onPress={() => setSheetDate(today)}
            />
          )}
        </div>
      </div>

      {/* Year grid */}
      <div style={{ paddingTop: 24 }}>
        {loading ? (
          <div style={{ padding: '0 20px' }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{
                height: 120, borderRadius: 16,
                backgroundColor: 'var(--surface2)',
                marginBottom: 20,
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        ) : (
          <YearGrid
            year={year}
            entries={entries}
            today={today}
            onDayPress={handleDayPress}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      {/* Tab bar */}
      <TabBar active="journal" />

      {/* Entry sheet */}
      <AnimatePresence>
        {sheetDate && (
          <EntrySheet
            key={sheetDate}
            dateStr={sheetDate}
            entry={entries.get(sheetDate) ?? null}
            onClose={() => setSheetDate(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
