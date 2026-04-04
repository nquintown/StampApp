'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'

export default function AuthProvider() {
  const { setUser, loadStamps } = useStore()

  useEffect(() => {
    const supabase = createClient()

    // Get current session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadStamps()
    })

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null
        setUser(user)
        if (user) {
          loadStamps()
        } else {
          // Clear stamps on logout
          useStore.setState({ stamps: [] })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
