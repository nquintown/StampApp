import type { Stamp } from './types'

export interface Achievement {
  id:      string
  emoji:   string
  label:   string
  desc:    string
  check:   (stamps: Stamp[], streak: number, collectionCount: number) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id:    'first_stamp',
    emoji: '🎉',
    label: 'Premier Stamp',
    desc:  'Crée ton premier stamp',
    check: (stamps) => stamps.length >= 1,
  },
  {
    id:    'five_stamps',
    emoji: '📸',
    label: 'Collectionneur',
    desc:  '5 stamps créés',
    check: (stamps) => stamps.length >= 5,
  },
  {
    id:    'twenty_stamps',
    emoji: '🔥',
    label: 'Prolifique',
    desc:  '20 stamps créés',
    check: (stamps) => stamps.length >= 20,
  },
  {
    id:    'fifty_stamps',
    emoji: '⭐',
    label: 'Légende',
    desc:  '50 stamps créés',
    check: (stamps) => stamps.length >= 50,
  },
  {
    id:    'streak_3',
    emoji: '📅',
    label: 'Sur ta lancée',
    desc:  '3 jours de suite',
    check: (_s, streak) => streak >= 3,
  },
  {
    id:    'streak_7',
    emoji: '🗓️',
    label: 'Semainier',
    desc:  '7 jours consécutifs',
    check: (_s, streak) => streak >= 7,
  },
  {
    id:    'streak_30',
    emoji: '💎',
    label: 'Inébranlable',
    desc:  '30 jours consécutifs',
    check: (_s, streak) => streak >= 30,
  },
  {
    id:    'first_collection',
    emoji: '📁',
    label: 'Organisé',
    desc:  'Crée ta première collection',
    check: (_s, _str, cols) => cols >= 1,
  },
]
