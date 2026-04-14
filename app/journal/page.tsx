'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TabBar from '@/components/TabBar'
import StampShape from '@/components/StampShape'
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

// ── 50 custom journal icons ───────────────────────────────────────────────────

const JOURNAL_ICONS: string[] = [
  `<path d="M15 35 L85 30 L80 75 L20 70 Z"/><path d="M15 35 L50 55 L85 30"/><path d="M50 50 C40 40,30 55,50 65 C70 55,60 40,50 50 Z"/>`,
  `<path d="M22 38 L78 35 L80 78 L20 80 Z"/><path d="M38 37 L40 22 L60 21 L62 36"/><path d="M32 38 L35 79 M68 36 L65 78"/><path d="M20 80 C18 84,23 88,26 84 M80 78 C82 82,75 86,73 82"/>`,
  `<path d="M15 30 L85 25 L85 45 C78 46,78 54,85 55 L83 75 L15 78 L18 58 C25 57,25 47,16 48 Z"/><path d="M68 28 L66 73" stroke-dasharray="4 6"/><path d="M25 45 L50 43 M26 55 L40 53 M25 65 L45 64"/>`,
  `<path d="M50 15 C20 18,12 40,15 55 C18 75,45 88,60 82 C80 75,90 45,80 25 C70 10,55 14,50 15"/><path d="M50 25 L55 50 L45 75 L40 50 Z"/><circle cx="48" cy="50" r="3" fill="currentColor"/>`,
  `<path d="M50 15 C30 15,25 35,25 45 C25 60,55 85,55 85 C55 85,75 60,75 45 C75 35,70 15,50 15 Z"/><path d="M50 30 C45 30,42 35,42 40 C42 45,45 50,50 50 C55 50,58 45,58 40 C58 35,55 30,50 30 Z"/>`,
  `<path d="M30 20 L75 25 L80 75 L50 88 L25 70 Z"/><circle cx="52" cy="78" r="4"/><path d="M52 82 C55 90,65 95,75 85 C80 80,85 90,90 80"/><path d="M40 40 L65 43 M38 52 L62 55 M36 64 L55 67"/>`,
  `<path d="M50 12 C20 12,15 45,30 62 L42 75 L58 73 L68 60 C85 45,80 12,50 12 Z"/><path d="M30 62 C45 45,55 45,68 60"/><path d="M50 12 C40 30,45 60,42 75"/><path d="M40 85 L42 95 L56 94 L54 83"/>`,
  `<path d="M50 90 C50 90,40 75,38 60 C35 30,20 20,50 10 C80 20,65 40,62 60 C60 75,50 90,50 90"/><path d="M50 10 C52 40,48 70,52 95"/><path d="M50 40 L35 30 M50 55 L65 45 M49 70 L35 60 M51 25 L65 18"/>`,
  `<path d="M20 35 L80 32 L85 75 L15 78 Z"/><path d="M50 42 C60 42,65 52,65 60 C65 68,55 73,50 73 C45 73,35 68,35 60 C35 52,40 42,50 42 Z"/><circle cx="50" cy="58" r="5" fill="currentColor"/><path d="M35 33 L38 22 L55 20 L58 30"/><path d="M65 31 L68 25 L75 26 L73 31"/>`,
  `<path d="M25 15 L75 20 L72 85 L28 80 Z"/><path d="M40 35 C40 30,60 30,60 35 C60 40,55 45,50 45 C45 45,40 40,40 35 Z"/><path d="M45 40 C45 45,55 45,55 40"/><path d="M40 60 L60 62 M38 70 L55 72" stroke-width="2"/>`,
  `<path d="M25 40 C25 60,25 75,45 78 C65 81,70 70,70 40 Z"/><path d="M70 45 C80 45,85 55,80 65 C75 75,70 70,70 65"/><path d="M40 30 C35 25,45 20,40 15" stroke-dasharray="3 3"/><path d="M50 32 C45 27,55 22,50 17" stroke-dasharray="3 3"/><path d="M60 30 C55 25,65 20,60 15" stroke-dasharray="3 3"/>`,
  `<path d="M25 40 C20 30,30 20,40 25 C50 30,45 45,35 45 C25 45,30 50,25 40 Z"/><path d="M42 35 L80 70"/><path d="M72 62 L80 55 L88 62 L80 70 L83 75 L75 80 L70 75"/>`,
  `<path d="M15 50 L85 15 L50 85 L45 55 Z"/><path d="M45 55 L85 15"/><path d="M10 80 C20 70,30 85,40 70" stroke-dasharray="5 5"/>`,
  `<path d="M20 18 L80 22 L78 85 L22 82 Z"/><path d="M30 28 L70 32 L68 62 L32 60 Z"/><path d="M35 55 C40 45,45 50,50 45 C55 40,60 55,65 50" stroke-width="2"/><path d="M55 35 C58 35,60 38,60 40 C60 42,58 45,55 45 C52 45,50 42,50 40 C50 38,52 35,55 35 Z" stroke-width="2"/><path d="M35 72 L60 75" stroke-width="2"/>`,
  `<path d="M45 80 C40 60,40 40,45 20 C50 15,60 15,55 20 C60 40,60 60,55 80"/><path d="M42 50 C30 50,25 40,30 30 C35 25,40 30,35 35 C35 40,40 45,42 45"/><path d="M58 60 C70 60,75 50,70 40 C65 35,60 40,65 45 C65 50,60 55,58 55"/><path d="M35 80 L65 82 L60 95 L40 93 Z"/>`,
  `<path d="M35 85 C20 80,25 40,45 35 L50 20 L60 22 L55 38 C75 45,75 85,65 90 C55 92,40 90,35 85 Z"/><path d="M50 20 L48 10 L58 12 L60 22"/><path d="M40 60 L55 50 M42 70 L58 60" stroke-width="2"/><path d="M32 60 C30 50,35 45,40 40" stroke-width="2"/>`,
  `<path d="M25 45 C25 15,75 20,75 45 C75 75,25 70,25 45 Z"/><path d="M20 45 C20 85,50 82,50 72"/><path d="M50 72 L48 88 L35 90 L65 88 L60 86"/><path d="M30 35 C40 30,45 45,40 55 C35 60,28 50,30 35 Z" stroke-width="2"/><path d="M60 25 C65 35,55 50,65 65" stroke-width="2"/>`,
  `<path d="M35 20 L65 22"/><path d="M38 20 C38 40,48 48,50 50 C52 48,62 40,62 22"/><path d="M50 50 C48 52,38 60,38 80 L62 80 C62 60,52 52,50 50 Z"/><path d="M35 80 L65 78"/><path d="M50 50 L49 68" stroke-dasharray="2 3" stroke-width="2"/><path d="M42 80 L50 70 L58 79" stroke-width="2"/>`,
  `<path d="M20 30 L80 32 L78 70 L22 68 Z"/><path d="M30 68 L35 55 L65 56 L68 70"/><path d="M25 35 L75 36 L74 50 L26 48 Z" stroke-width="2"/><circle cx="38" cy="42" r="4"/><circle cx="62" cy="43" r="4"/>`,
  `<path d="M20 70 C40 80,60 78,80 65 L75 60 L25 62 Z"/><path d="M50 61 L48 20"/><path d="M48 20 C65 30,70 50,50 55 Z"/><path d="M48 25 L30 58 L49 55"/><path d="M25 85 C30 80,40 90,45 85 C50 80,60 90,65 85" stroke-width="2"/>`,
  `<path d="M20 45 C15 65,40 68,45 48 C45 40,25 35,20 45 Z"/><path d="M55 48 C60 68,85 65,80 45 C75 35,55 40,55 48 Z"/><path d="M45 46 C48 44,52 44,55 46"/><path d="M22 45 L15 35 M78 45 L85 30" stroke-width="2"/>`,
  `<path d="M35 30 L65 32 L58 20 L42 18 Z"/><path d="M42 18 C30 5,70 5,58 20"/><path d="M38 30 C30 50,32 60,40 75 L60 76 C68 60,70 50,62 32"/><path d="M35 75 L65 77 L62 85 L38 84 Z"/><path d="M50 65 C45 60,48 50,50 45 C52 50,55 60,50 65 Z" stroke-width="2"/>`,
  `<path d="M30 80 C15 80,15 50,30 50 C45 50,45 80,30 80 Z"/><path d="M75 80 C60 80,60 50,75 50 C90 50,90 80,75 80 Z"/><path d="M30 65 L45 45 L75 65"/><path d="M45 45 L60 45 L75 65"/><path d="M60 45 L52 70"/><path d="M45 45 L42 35 M38 35 L48 34" stroke-width="4"/><path d="M60 45 L65 30 M60 30 L70 25"/>`,
  `<path d="M50 90 C55 70,45 50,50 35"/><path d="M48 65 C35 60,30 75,49 70"/><path d="M50 35 C30 30,35 15,50 25 C65 15,70 30,50 35 C75 40,65 55,50 45 C35 55,25 40,50 35 Z"/><circle cx="50" cy="35" r="3" fill="currentColor"/>`,
  `<path d="M30 50 L32 85 L72 82 L68 52 Z"/><path d="M20 55 L50 25 L80 50"/><path d="M60 35 L60 20 L68 22 L65 42"/><path d="M45 83 L45 65 L55 64 L56 82"/><path d="M35 60 L42 60 L42 68 L36 67 Z" stroke-width="2"/>`,
  `<path d="M35 25 C45 20,55 20,65 25 L63 75 C53 80,43 80,33 75 Z"/><path d="M30 25 C40 20,60 20,70 25 L68 30 C58 25,42 25,32 30 Z"/><path d="M28 75 C38 80,58 80,68 75 L66 70 C56 75,40 75,30 70 Z"/><path d="M63 40 L85 45 L80 85 L58 80"/><path d="M68 50 L73 51 M66 60 L71 61 M64 70 L69 71" stroke-width="2"/>`,
  `<path d="M20 80 C40 60,50 30,75 20"/><path d="M25 75 C15 60,30 40,50 30 C60 25,75 20,75 20 C75 20,65 35,60 50 C50 70,35 85,20 80 Z"/><path d="M45 42 L35 48 M55 35 L45 40 M40 60 L30 65" stroke-width="2"/><path d="M20 80 L15 88 L23 83"/>`,
  `<path d="M42 25 C42 15,58 15,58 25 C58 35,42 35,42 25 Z"/><path d="M50 33 L48 82"/><path d="M30 45 L70 42"/><path d="M25 70 C25 90,75 90,75 65"/><path d="M25 70 L18 75 L30 78 Z"/><path d="M75 65 L68 70 L80 72 Z"/>`,
  `<path d="M50 30 L20 80 L80 78 Z"/><path d="M50 30 C45 50,35 70,40 80"/><path d="M50 30 C55 50,65 70,60 78"/><path d="M15 82 L22 80 M78 78 L85 76" stroke-width="2"/><path d="M48 25 L50 30 M52 26 L50 30" stroke-width="2"/>`,
  `<path d="M30 50 L48 90 C50 95,55 90,68 50"/><path d="M35 55 L65 53 M40 65 L60 62 M45 75 L55 72" stroke-width="2"/><path d="M30 50 C20 40,30 25,40 25 C45 15,60 15,65 25 C75 25,80 40,68 50 C60 55,40 55,30 50 Z"/><path d="M35 52 C35 60,40 60,40 52"/>`,
  `<path d="M35 85 L65 85 M48 85 L50 35"/><path d="M45 35 L55 35 L58 15 L42 15 Z"/><path d="M40 15 L50 5 L60 15"/><path d="M25 25 L32 28 M75 25 L68 28 M20 40 L30 38 M80 40 L70 38" stroke-dasharray="3 3"/><circle cx="50" cy="25" r="2" fill="currentColor"/>`,
  `<path d="M10 80 L35 35 L50 55 L75 25 L90 75 Z"/><path d="M25 53 L30 58 L38 50 L42 55"/><path d="M62 45 L68 52 L75 45 L82 55"/><path d="M45 25 C55 15,70 20,65 30"/>`,
  `<path d="M15 25 L85 20 L82 80 L18 85 Z"/><path d="M68 30 L78 28 L76 42 L66 44 Z"/><path d="M50 25 L48 78" stroke-dasharray="4 4"/><path d="M22 35 L42 33 M20 48 L38 46 M24 60 L40 58"/><path d="M55 55 L75 53 M52 65 L72 63" stroke-width="2"/>`,
  `<path d="M30 42 L35 85 L65 82 L70 40"/><path d="M25 42 L75 40 L70 30 L30 32 Z"/><path d="M45 34 L55 33" stroke-width="2"/><path d="M32 55 L68 53 M33 70 L66 68"/><circle cx="50" cy="61" r="4"/>`,
  `<path d="M50 15 L48 90"/><path d="M48 25 L80 20 L85 30 L78 35 L48 35"/><path d="M48 50 L20 45 L15 55 L22 60 L48 60"/><path d="M35 90 L45 80 L55 88 L65 82" stroke-width="2"/>`,
  `<path d="M50 25 C25 25,20 50,22 70 C25 90,50 95,70 85 C85 70,85 45,75 30 C65 20,55 24,50 25 Z"/><path d="M45 25 L45 15 C45 5,55 5,55 15 L55 24"/><path d="M48 10 L52 10 M46 5 L54 5" stroke-width="2"/><path d="M50 55 L62 42 M50 55 L45 38"/><circle cx="50" cy="55" r="3" fill="currentColor"/>`,
  `<path d="M30 45 L70 42 L72 85 L28 88 Z"/><path d="M35 45 L35 30 C35 15,65 15,65 30 L65 42"/><path d="M50 60 C45 55,55 55,50 60 L50 70"/><circle cx="50" cy="62" r="3" fill="currentColor"/>`,
  `<path d="M20 40 C20 15,80 15,80 40 C80 60,65 75,55 85 L45 85 C35 75,20 60,20 40 Z"/><path d="M40 85 L35 95 L65 92 L60 85"/><path d="M25 40 C35 60,45 80,45 85"/><path d="M40 25 C45 55,50 85,50 85"/><path d="M60 25 C55 55,55 85,55 85"/><path d="M75 40 C65 60,55 80,55 85"/>`,
  `<path d="M50 15 L75 40 L45 75 L25 35 Z"/><path d="M50 15 L45 75 M25 35 L75 40"/><path d="M45 75 C60 85,30 95,50 100"/><path d="M50 82 L60 80 M42 92 L52 90" stroke-width="2"/>`,
  `<path d="M30 40 C20 30,25 15,35 15 C45 15,50 30,40 40 Z"/><path d="M32 45 C25 45,25 60,35 60 C45 60,45 45,38 45 Z"/><path d="M60 65 C50 55,55 40,65 40 C75 40,80 55,70 65 Z"/><path d="M62 70 C55 70,55 85,65 85 C75 85,75 70,68 70 Z"/><path d="M10 85 C20 80,40 95,50 85" stroke-dasharray="3 4" stroke-width="2"/>`,
  `<path d="M35 22 L65 20 L66 30 L34 32 Z"/><path d="M38 21 L38 15 L62 14 L62 20"/><path d="M36 32 C25 40,25 75,30 85 C35 95,65 95,70 85 C75 75,75 40,64 30"/><path d="M45 75 L48 68 L55 70 L50 78 Z"/><circle cx="60" cy="72" r="3"/><path d="M32 50 C30 60,32 70,35 75" stroke-width="2"/>`,
  `<path d="M15 55 C20 15,80 15,85 55"/><path d="M15 55 C25 50,35 55,38 53 C45 48,55 55,62 53 C70 48,80 55,85 55"/><path d="M50 18 C48 30,42 45,38 53"/><path d="M50 18 C52 30,58 45,62 53"/><path d="M50 50 L48 80 C48 90,38 90,38 82"/><path d="M50 18 L51 10"/>`,
  `<path d="M20 40 L80 38 L82 85 L18 88 Z"/><path d="M25 40 C25 20,75 18,75 38"/><path d="M25 39 L15 10"/><circle cx="14" cy="8" r="2" fill="currentColor"/><circle cx="40" cy="65" r="12"/><path d="M35 60 L45 70 M35 70 L45 60" stroke-width="2"/><circle cx="68" cy="55" r="4"/><circle cx="67" cy="72" r="4"/>`,
  `<path d="M30 20 C40 10,60 15,70 25 L60 85 C50 95,30 90,20 80 Z"/><path d="M30 20 C20 30,35 35,45 28 C55 20,65 30,70 25"/><path d="M35 30 L15 35 L12 65 L25 75" stroke-width="2"/><path d="M45 50 L55 60 M45 60 L55 50" stroke-width="2"/>`,
  `<path d="M25 35 L75 30 L80 85 L30 90 Z"/><path d="M60 25 L60 18 C60 10,48 10,48 18 L48 45"/><path d="M48 45 C48 50,55 50,55 45 L55 25 C55 20,52 20,52 25 L52 35"/><path d="M40 50 L65 48 M38 65 L60 63" stroke-width="2"/>`,
  `<path d="M40 45 C25 40,20 65,30 70 C20 85,40 95,50 90 C60 95,80 85,70 70 C80 65,75 40,60 45 Z"/><circle cx="50" cy="62" r="7"/><path d="M46 15 L54 15 L52 46 L48 46 Z"/><path d="M46 15 L44 5 L56 5 L54 15"/><path d="M48 20 L48 75 M52 20 L52 75" stroke-width="1.5"/>`,
  `<path d="M25 55 C25 25,75 25,75 55 C75 85,25 85,25 55 Z"/><path d="M35 33 C30 20,45 20,45 30"/><path d="M65 33 C70 20,55 20,55 30"/><path d="M50 30 L50 22 M47 22 L53 22" stroke-width="2"/><path d="M35 80 L30 90 M65 80 L70 90"/><path d="M50 55 L60 45 M50 55 L45 42"/>`,
  `<path d="M30 45 C45 35,60 40,65 50 C65 60,45 65,30 55 C25 50,25 48,30 45 Z"/><path d="M65 48 L75 46 L64 52"/><path d="M45 42 C40 20,20 15,20 15 C35 30,40 40,42 48"/><path d="M30 50 L10 60 L22 55 L12 70 L30 55"/><circle cx="60" cy="46" r="1.5" fill="currentColor"/>`,
  `<path d="M25 50 C25 20,75 25,75 50 C75 80,25 75,25 50 Z"/><circle cx="50" cy="50" r="8"/><path d="M50 25 L50 10 M50 75 L50 90"/><path d="M25 50 L10 50 M75 50 L90 50"/><path d="M32 32 L20 20 M68 68 L80 80"/><path d="M32 68 L20 80 M68 32 L80 20"/>`,
  `<path d="M25 25 L40 25 L45 55 L75 60 C80 65,80 75,75 75 L20 75 Z"/><circle cx="35" cy="85" r="6"/><circle cx="60" cy="85" r="6"/><path d="M75 70 L85 80" stroke-width="4"/><path d="M38 30 L45 32 M39 40 L46 42 M42 50 L48 52" stroke-width="2"/><path d="M25 65 L60 68" stroke-width="2"/>`,
]

// Seeded Fisher-Yates shuffle — deterministic per year+month
function seededShuffle(seed: number, n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  let s = seed | 0
  for (let i = n - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0
    const j = (s >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function JournalIcon({ dateStr, size = 20 }: { dateStr: string; size?: number }) {
  const parts = dateStr.split('-').map(Number)
  const [y, m, d] = parts
  // Unique seed per year-month → no icon repeated in same month
  const perm = seededShuffle(y * 12 + m, 50)
  const idx = perm[(d - 1) % 50]
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g dangerouslySetInnerHTML={{ __html: JOURNAL_ICONS[idx] }} />
    </svg>
  )
}

// ── YearGrid ──────────────────────────────────────────────────────────────────

interface YearGridProps {
  year: number
  entries: Map<string, JournalEntry>
  today: string
  onDayPress: (dateStr: string, entry: JournalEntry | null) => void
  showAll: boolean
}

function YearGrid({ year, entries, today, onDayPress, showAll }: YearGridProps) {
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

        // Hide past months unless showAll is true
        if (isPastMonth && !showAll) return null

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
                  padding: '3px 0',
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

                const color = entry?.stampDominantColor ?? 'var(--text-primary)'

                return (
                  <motion.button
                    key={dateStr}
                    whileTap={!isFuture ? { scale: 0.85 } : {}}
                    onClick={() => !isFuture && onDayPress(dateStr, entry)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      background: isToday ? 'var(--surface2)' : 'none',
                      border: isToday
                        ? '1.5px solid var(--text-primary)'
                        : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFuture ? 'default' : 'pointer',
                      padding: 0,
                      WebkitTapHighlightColor: 'transparent',
                      opacity: isFuture ? 0.35 : 1,
                      transition: 'opacity 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {entry ? (
                      /* Has entry: show custom icon */
                      <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <JournalIcon dateStr={dateStr} size={38} />
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
      {/* Stamp-shaped thumbnail or botanical icon */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 68 }}>
        {todayEntry?.stampThumbnailUrl ? (
          <StampShape imageUrl={todayEntry.stampThumbnailUrl} width={52} height={64} />
        ) : (
          <div style={{
            width: 52, height: 64,
            backgroundColor: 'var(--surface2)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)',
            transition: 'background-color 0.25s ease',
          }}>
            <JournalIcon dateStr={todayLocal()} size={24} />
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
  const { user } = useStore()
  const router = useRouter()
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

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const saved = await upsertJournalEntry({
        userId: user.id,
        entryDate: dateStr,
        stampId: entry?.stampId ?? null,
        note: note.trim() || null,
        stampThumbnailUrl: entry?.stampThumbnailUrl ?? null,
        stampDominantColor: entry?.stampDominantColor ?? null,
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

          {/* Stamp preview + retake button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { onClose(); router.push('/camera?daily=true') }}
            style={{
              width: '100%', marginBottom: 20,
              borderRadius: 16, overflow: 'hidden',
              border: '1.5px solid var(--border)',
              backgroundColor: 'var(--surface2)',
              cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center',
              WebkitTapHighlightColor: 'transparent',
              transition: 'border-color 0.2s ease, background-color 0.25s ease',
            }}
          >
            {/* Stamp-shaped thumbnail */}
            <div style={{
              width: 72, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '10px 8px 10px 12px',
            }}>
              {entry?.stampThumbnailUrl ? (
                <StampShape
                  imageUrl={entry.stampThumbnailUrl}
                  width={52}
                  height={62}
                />
              ) : (
                <div style={{
                  width: 52, height: 62,
                  backgroundColor: 'var(--surface2)',
                  borderRadius: 8, border: '1.5px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Label */}
            <div style={{ flex: 1, padding: '0 16px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', transition: 'color 0.25s ease' }}>
                {entry?.stampThumbnailUrl ? 'Reprendre la photo' : 'Ajouter une photo'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)', transition: 'color 0.25s ease' }}>
                Ouvrir la caméra →
              </p>
            </div>
          </motion.button>

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
              disabled={saving}
              style={{
                flex: 1, height: 50,
                borderRadius: 14,
                backgroundColor: saving
                  ? 'var(--surface2)'
                  : 'var(--text-primary)',
                color: saving
                  ? 'var(--text-secondary)'
                  : 'var(--bg)',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
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
  const router = useRouter()
  const [year] = useState(() => new Date().getFullYear())
  const [entries, setEntries] = useState<Map<string, JournalEntry>>(new Map())
  const [loading, setLoading] = useState(true)
  const [sheetDate, setSheetDate] = useState<string | null>(null)
  const [showAllMonths, setShowAllMonths] = useState(false)
  const today = todayLocal()

  // Load entries for current year
  const loadEntries = useCallback(() => {
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

  useEffect(() => { loadEntries() }, [loadEntries])

  // Refetch when navigating back to this page
  useEffect(() => {
    const handleFocus = () => loadEntries()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadEntries])

  const todayEntry = entries.get(today) ?? null

  const handleDayPress = useCallback((dateStr: string, entry: JournalEntry | null) => {
    const today = todayLocal()
    if (dateStr > today) return  // future: nothing

    if (dateStr === today) {
      // Today: full access (edit + delete)
      if (!entry) {
        router.push('/camera?daily=true')
      } else {
        setSheetDate(dateStr)
      }
      return
    }

    // Past days: read-only — view stamp only
    if (entry?.stampId) {
      router.push(`/stamps/${entry.stampId}`)
    }
  }, [router])

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
          {/* Progress ring — click to show/hide past months */}
          {!loading && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAllMonths(v => !v)}
              style={{
                position: 'relative', width: 44, height: 44,
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke={showAllMonths ? 'var(--text-secondary)' : 'var(--text-primary)'}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.25s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: showAllMonths ? 'var(--text-secondary)' : 'var(--text-primary)', transition: 'color 0.25s ease' }}>
                  {progress}%
                </span>
              </div>
            </motion.button>
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
              onPress={() => {
                if (!todayEntry) router.push('/camera?daily=true')
                else setSheetDate(today)
              }}
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
            showAll={showAllMonths}
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
