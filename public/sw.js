// ── Stampverse Service Worker ─────────────────────────────
// Handles push notifications and notification clicks

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ── Push event ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data   = event.data?.json() ?? {}
  const title  = data.title ?? 'Stampverse'
  const body   = data.body  ?? "C'est l'heure de ton stamp du jour !"
  const url    = data.url   ?? '/camera'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:      '/icon-192.png',
      badge:     '/icon-192.png',
      tag:       'daily-stamp',
      renotify:  true,
      vibrate:   [100, 50, 100],
      data:      { url },
      actions:   [{ action: 'open', title: '📸 Créer mon stamp' }],
    })
  )
})

// ── Notification click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? '/camera'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus()
            client.navigate?.(targetUrl)
            return
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
