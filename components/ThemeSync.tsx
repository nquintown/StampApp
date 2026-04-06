'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function ThemeSync() {
  const { isDark, toggleDark } = useStore()

  // On mount: restore from localStorage if different from store default
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' && !isDark) toggleDark()
    else if (saved === 'light' && isDark) toggleDark()
    // If no saved value, keep store default (light)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On change: apply class + persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return null
}
