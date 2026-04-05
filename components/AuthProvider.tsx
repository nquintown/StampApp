'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'

export default function AuthProvider() {
  const { setUser, loadStamps } = useStore()

  useEffect(() => {
    const supabase = createClient()

    // Sync profile email so friend search by email works
    const syncProfile = async (user: import('@supabase/supabase-js').User) => {
      await supabase.from('profiles').upsert(
        { id: user.id, email: user.email ?? null },
        { onConflict: 'id', ignoreDuplicates: false },
      )
    }

    // Get current session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) { loadStamps(); syncProfile(user) }
    })

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null
        setUser(user)
        if (user) {
          loadStamps()
          syncProfile(user)
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
