'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function ThemeSync() {
  const isDark = useStore((s) => s.isDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])
  return null
}
