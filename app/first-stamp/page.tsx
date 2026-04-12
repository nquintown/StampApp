'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FirstStampRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/daily-stamp') }, [router])
  return null
}
