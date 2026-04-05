// ── Tag color palette ─────────────────────────────────────────────────────────
// Pastels that complement the beige DA — each tag always gets the same color

export const TAG_PALETTE = [
  { bg: '#FFE4E4', text: '#B91C1C', dot: '#EF4444' }, // red
  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' }, // amber
  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' }, // emerald
  { bg: '#DBEAFE', text: '#1D4ED8', dot: '#3B82F6' }, // blue
  { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' }, // violet
  { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' }, // pink
  { bg: '#FFEDD5', text: '#9A3412', dot: '#F97316' }, // orange
  { bg: '#ECFDF5', text: '#065F46', dot: '#34D399' }, // teal
] as const

export type TagColor = (typeof TAG_PALETTE)[number]

/** Stable color for any tag string — same tag always gets the same color */
export function getTagColor(tag: string): TagColor {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length]
}

/** Normalise raw user input into a clean tag slug */
export function normaliseTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-àâäéèêëîïôùûüç]/g, '')
    .slice(0, 24)
}

/** Quick-pick suggestions shown below the input */
export const SUGGESTED_TAGS = [
  'voyage', 'nature', 'art', 'food', 'amis',
  'musique', 'sport', 'urbain', 'cinéma', 'souvenir',
  'architecture', 'couleurs',
]
