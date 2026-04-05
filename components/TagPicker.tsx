'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TagChip from '@/components/TagChip'
import { normaliseTag, SUGGESTED_TAGS } from '@/lib/tags'

// Two visual themes: 'camera' = hardcoded beige, 'default' = CSS vars
const THEMES = {
  default: {
    inputBg:     'var(--surface)',
    inputBorder: 'var(--border)',
    inputText:   'var(--text-primary)',
    label:       'var(--text-secondary)',
    suggBorder:  'var(--border)',
    suggText:    'var(--text-secondary)',
    btnBg:       'var(--text-primary)',
    btnText:     'var(--bg)',
    hashColor:   'var(--text-secondary)',
  },
  camera: {
    inputBg:     '#FFFFFF',
    inputBorder: '#E7E1D5',
    inputText:   '#1E1E1C',
    label:       '#6B6B67',
    suggBorder:  '#E7E1D5',
    suggText:    '#6B6B67',
    btnBg:       '#1E1E1C',
    btnText:     '#F7F4ED',
    hashColor:   '#6B6B67',
  },
} as const

interface TagPickerProps {
  tags: string[]
  onChange: (tags: string[]) => void
  max?: number
  variant?: keyof typeof THEMES
}

export default function TagPicker({
  tags,
  onChange,
  max = 5,
  variant = 'default',
}: TagPickerProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const t = THEMES[variant]

  const addTag = (raw: string) => {
    const tag = normaliseTag(raw)
    if (!tag || tags.includes(tag) || tags.length >= max) return
    onChange([...tags, tag])
    setInput('')
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => onChange(tags.filter((x) => x !== tag))

  const suggestions = SUGGESTED_TAGS.filter(
    (s) => !tags.includes(s) && (input === '' || s.includes(input.toLowerCase())),
  ).slice(0, 6)

  return (
    <div>
      {/* Current tag chips */}
      <AnimatePresence initial={false}>
        {tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, overflow: 'hidden' }}
          >
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{ display: 'inline-flex' }}
              >
                <TagChip tag={tag} onRemove={() => removeTag(tag)} />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      {tags.length < max && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: t.inputBg,
            borderRadius: 14,
            padding: '11px 14px',
            border: `1.5px solid ${t.inputBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: 15, color: t.hashColor, fontWeight: 600, lineHeight: 1 }}>#</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTag(input)
              }
              if (e.key === 'Backspace' && !input && tags.length > 0) {
                removeTag(tags[tags.length - 1])
              }
            }}
            placeholder={tags.length === 0 ? 'voyage, nature, art…' : `Ajouter… (${tags.length}/${max})`}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: t.inputText,
              fontFamily: 'inherit',
            }}
          />
          <AnimatePresence>
            {input.trim() && (
              <motion.button
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => addTag(input)}
                style={{
                  backgroundColor: t.btnBg,
                  border: 'none',
                  cursor: 'pointer',
                  color: t.btnText,
                  borderRadius: 9,
                  padding: '4px 11px',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                +
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Suggestion pills */}
      <AnimatePresence>
        {suggestions.length > 0 && tags.length < max && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}
          >
            {suggestions.map((s) => (
              <motion.button
                key={s}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => addTag(s)}
                style={{
                  background: 'transparent',
                  border: `1px dashed ${t.suggBorder}`,
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: t.suggText,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                +#{s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
