import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ── Daily notification payloads ───────────────────────────
const MESSAGES = [
  { title: 'Stamply 📸', body: "C'est l'heure de ton stamp du jour !" },
  { title: 'Stamply 🌅', body: "Un nouveau souvenir t'attend aujourd'hui." },
  { title: 'Stamply ✨', body: 'Capture quelque chose de beau aujourd\'hui.' },
  { title: 'Stamply 🎯', body: 'Ton stamp quotidien t\'attend !' },
  { title: 'Stamply 🌿', body: 'Immortalise ce moment avant qu\'il ne passe.' },
]

// ── Slot assignment: deterministic per endpoint ───────────
// 3 slots: 0 = 11h UTC, 1 = 15h UTC, 2 = 19h UTC
function endpointSlot(endpoint: string): number {
  let hash = 0
  for (let i = 0; i < endpoint.length; i++) {
    hash = (hash * 31 + endpoint.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % 3
}

const SLOT_HOURS: Record<number, number> = { 0: 11, 1: 15, 2: 19 }

export async function GET(request: NextRequest) {
  // ── Auth: only Vercel Cron can call this ─────────────────
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Determine which slot to send for this run ─────────────
  const currentHour = new Date().getUTCHours()
  const currentSlot = Object.entries(SLOT_HOURS).find(
    ([, h]) => h === currentHour,
  )?.[0]

  if (currentSlot === undefined) {
    return NextResponse.json({ skipped: true, reason: `No slot at UTC ${currentHour}h` })
  }

  const slot = Number(currentSlot)

  // ── VAPID config ──────────────────────────────────────────
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

  const { data: allSubs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Filter to only this slot's subscribers ────────────────
  const subscriptions = (allSubs ?? []).filter(
    (sub) => endpointSlot(sub.endpoint) === slot,
  )

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, slot, hour: currentHour })
  }

  // ── Pick random message ───────────────────────────────────
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const payload = JSON.stringify({ ...msg, url: '/camera?daily=true' })

  // ── Send to slot subscribers ──────────────────────────────
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ),
    ),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  // ── Clean up expired subscriptions ───────────────────────
  const expired = subscriptions.filter((_, i) => {
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

  return NextResponse.json({ sent, failed, expired: expired.length, slot, hour: currentHour })
}
