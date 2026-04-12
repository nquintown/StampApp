'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { getJournalEntryForDate } from '@/lib/journal-db'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function checkAndRedirectDaily(
  userId: string,
  router: ReturnType<typeof useRouter>,
) {
  const today = todayISO()
  const key = `stamply_daily_ok_${today}`
  if (typeof window !== 'undefined' && localStorage.getItem(key)) return
  try {
    const entry = await getJournalEntryForDate(userId, today)
    if (entry) {
      localStorage.setItem(key, 'true')
    } else {
      router.replace('/daily-stamp')
    }
  } catch {
    // Fail silently — don't block the user
  }
}

export default function AuthProvider() {
  const { setUser, loadStamps } = useStore()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Sync profile email so friend search by email works
    const syncProfile = async (user: import('@supabase/supabase-js').User) => {
      await supabase.from('profiles').upsert(
        { id: user.id, email: user.email ?? null },
        { onConflict: 'id', ignoreDuplicates: false },
      )
    }

    // Get current session on mount (page refresh / already logged in)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadStamps()
        syncProfile(user)
        checkAndRedirectDaily(user.id, router)
      }
    })

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        if (user) {
          loadStamps()
          syncProfile(user)
          // On fresh sign-in, check daily stamp
          if (event === 'SIGNED_IN') {
            checkAndRedirectDaily(user.id, router)
          }
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
