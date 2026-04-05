import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── Daily notification payloads ───────────────────────────
const MESSAGES = [
  { title: 'Stampverse 📸', body: "C'est l'heure de ton stamp du jour !" },
  { title: 'Stampverse 🌅', body: 'Un nouveau souvenir t\'attend aujourd\'hui.' },
  { title: 'Stampverse ✨', body: 'Capture quelque chose de beau aujourd\'hui.' },
  { title: 'Stampverse 🎯', body: 'Ton stamp quotidien t\'attend !' },
]

export async function GET(request: NextRequest) {
  // ── Auth: only Vercel Cron can call this ─────────────────
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── VAPID config (must be inside handler, not module-level) ──
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  // ── Use service role to bypass RLS ───────────────────────
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Pick random message ───────────────────────────────────
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const payload = JSON.stringify({ ...msg, url: '/camera' })

  // ── Send to all subscribers ───────────────────────────────
  const results = await Promise.allSettled(
    (subscriptions ?? []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
    ),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  // ── Clean up expired subscriptions ───────────────────────
  const expired = (subscriptions ?? []).filter((_, i) => {
    const r = results[i]
    return r.status === 'rejected' &&
      (r.reason as { statusCode?: number })?.statusCode === 410
  })

  if (expired.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expired.map((s) => s.endpoint))
  }

  return NextResponse.json({ sent, failed, expired: expired.length })
}
