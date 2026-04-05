'use client'

import { getTagColor } from '@/lib/tags'

interface TagChipProps {
  tag: string
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export default function TagChip({ tag, onRemove, size = 'md' }: TagChipProps) {
  const { bg, text, dot } = getTagColor(tag)
  const sm = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sm ? 4 : 5,
        backgroundColor: bg,
        borderRadius: 20,
        padding: sm ? '2px 8px' : '5px 10px',
        fontSize: sm ? 11 : 12,
        fontWeight: 600,
        color: text,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {/* Colored dot */}
      <span
        style={{
          width: sm ? 5 : 6,
          height: sm ? 5 : 6,
          borderRadius: '50%',
          backgroundColor: dot,
          flexShrink: 0,
        }}
      />

      #{tag}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: text,
            opacity: 0.6,
            fontSize: 15,
            padding: 0,
            marginLeft: 1,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ×
        </button>
      )}
    </span>
  )
}
