'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { IconButton } from '@/components/TopBar'
import {
  searchUsers,
  getFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendship,
  type FriendUser,
  type FriendRequest,
  type SearchResult,
} from '@/lib/friends-db'
import { getUnseenCount } from '@/lib/sharing-db'

// ── Avatar ────────────────────────────────────────────────
function Avatar({ user, size = 44 }: { user: FriendUser; size?: number }) {
  const name   = user.username || user.fullName || '?'
  const letter = name.charAt(0).toUpperCase()

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: 'var(--text-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: 'var(--bg)',
      fontSize: size * 0.38, fontWeight: 700, lineHeight: 1,
      transition: 'background-color 0.25s ease',
    }}>
      {letter}
    </div>
  )
}

// ── Section title ─────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      margin: '0 0 8px 4px', transition: 'color 0.25s ease',
    }}>
      {title}
    </p>
  )
}

// ── Card wrapper ──────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', borderRadius: 18,
      border: '1px solid var(--border)', overflow: 'hidden',
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function FriendsPage() {
  const router = useRouter()
  const { user } = useStore()

  const [query,         setQuery]         = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [friendships,   setFriendships]   = useState<FriendRequest[]>([])
  const [searching,     setSearching]     = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [unseenCount,   setUnseenCount]   = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadFriendships = useCallback(async () => {
    if (!user) return
    const data = await getFriendships(user.id)
    setFriendships(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadFriendships()
    if (user) {
      getUnseenCount(user.id).then(setUnseenCount)
    }
  }, [loadFriendships, user])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      if (!user) return
      const results = await searchUsers(query, user.id)
      setSearchResults(results)
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, user])

  const handleAdd = async (result: SearchResult) => {
    if (!user) return
    const res = await sendFriendRequest(user.id, result.user.userId)
    if (res) {
      setSearchResults((prev) =>
        prev.map((r) =>
          r.user.userId === result.user.userId
            ? { ...r, status: 'sent', friendshipId: res.friendshipId }
            : r,
        ),
      )
    }
  }

  const handleAccept = async (fr: FriendRequest) => {
    await acceptFriendRequest(fr.id)
    await loadFriendships()
  }

  const handleDelete = async (fr: FriendRequest) => {
    await deleteFriendship(fr.id)
    await loadFriendships()
  }

  // Derived lists
  const pendingReceived = friendships.filter((f) => f.status === 'pending' && !f.isSentByMe)
  const pendingSent     = friendships.filter((f) => f.status === 'pending' && f.isSentByMe)
  const friends         = friendships.filter((f) => f.status === 'accepted')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 48, transition: 'background-color 0.25s ease' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <IconButton label="Retour" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px', transition: 'color 0.25s ease' }}>
          Mes amis
        </span>
        {/* Inbox button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/friends/inbox')}
          style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background-color 0.25s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" color="var(--text-primary)">
            <path d="M2 3.5C2 2.67 2.67 2 3.5 2H14.5C15.33 2 16 2.67 16 3.5V11.5C16 12.33 15.33 13 14.5 13H10L6 16V13H3.5C2.67 13 2 12.33 2 11.5V3.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {unseenCount > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: '50%',
              backgroundColor: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--bg)',
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            </div>
          )}
        </motion.button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-secondary)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par username…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 40px 13px 40px',
              borderRadius: 14, border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              fontSize: 15, color: 'var(--text-primary)',
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s ease, background-color 0.25s ease',
            }}
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="var(--surface2)" />
                <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="var(--text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* SEARCH RESULTS */}
        <AnimatePresence mode="wait">
          {query.trim() !== '' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
            >
              <SectionTitle title={searching ? 'Recherche…' : `Résultats (${searchResults.length})`} />
              <Card>
                {searching ? (
                  [0, 1, 2].map((i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
                      <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  ))
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    Aucun utilisateur trouvé
                  </div>
                ) : (
                  searchResults.map((r, i) => (
                    <SearchRow
                      key={r.user.userId}
                      result={r}
                      isLast={i === searchResults.length - 1}
                      onAdd={() => handleAdd(r)}
                      onAccept={() => {
                        if (r.friendshipId) {
                          acceptFriendRequest(r.friendshipId).then(() => {
                            setSearchResults((prev) =>
                              prev.map((x) => x.user.userId === r.user.userId ? { ...x, status: 'friend' } : x)
                            )
                            loadFriendships()
                          })
                        }
                      }}
                      onDecline={() => {
                        if (r.friendshipId) {
                          deleteFriendship(r.friendshipId).then(() => {
                            setSearchResults((prev) =>
                              prev.map((x) => x.user.userId === r.user.userId ? { ...x, status: 'none', friendshipId: null } : x)
                            )
                            loadFriendships()
                          })
                        }
                      }}
                    />
                  ))
                )}
              </Card>
            </motion.div>
          )}

          {/* CONTENT (when not searching) */}
          {query.trim() === '' && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              {/* Pending received */}
              {pendingReceived.length > 0 && (
                <div>
                  <SectionTitle title={`Demandes reçues (${pendingReceived.length})`} />
                  <Card>
                    {pendingReceived.map((fr, i) => (
                      <FriendshipRow
                        key={fr.id}
                        fr={fr}
                        isLast={i === pendingReceived.length - 1}
                        onAccept={() => handleAccept(fr)}
                        onDelete={() => handleDelete(fr)}
                        type="received"
                      />
                    ))}
                  </Card>
                </div>
              )}

              {/* Friends */}
              <div>
                <SectionTitle title={`Amis (${friends.length})`} />
                {loading ? (
                  <Card>
                    {[0, 1].map((i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
                        <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                      </div>
                    ))}
                  </Card>
                ) : friends.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '32px 20px', gap: 10, textAlign: 'center',
                    backgroundColor: 'var(--surface)', borderRadius: 18,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      backgroundColor: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3.1-6 7-6M16 11v6M13 14h6" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
                      Aucun ami pour l'instant
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
                      Recherche des amis pour les ajouter à ta liste
                    </p>
                  </div>
                ) : (
                  <Card>
                    {friends.map((fr, i) => (
                      <FriendshipRow
                        key={fr.id}
                        fr={fr}
                        isLast={i === friends.length - 1}
                        onDelete={() => handleDelete(fr)}
                        type="friend"
                      />
                    ))}
                  </Card>
                )}
              </div>

              {/* Pending sent */}
              {pendingSent.length > 0 && (
                <div>
                  <SectionTitle title="Demandes envoyées" />
                  <Card>
                    {pendingSent.map((fr, i) => (
                      <FriendshipRow
                        key={fr.id}
                        fr={fr}
                        isLast={i === pendingSent.length - 1}
                        onDelete={() => handleDelete(fr)}
                        type="sent"
                      />
                    ))}
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}

// ── Search result row ─────────────────────────────────────
function SearchRow({
  result, isLast, onAdd, onAccept, onDecline,
}: {
  result:    SearchResult
  isLast:    boolean
  onAdd:     () => void
  onAccept:  () => void
  onDecline: () => void
}) {
  const { user, status } = result
  const name = user.username || user.fullName || 'Utilisateur'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={user} />
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
          {name}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {status === 'none' && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={onAdd}
            style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background-color 0.25s ease',
            }}>
            Ajouter
          </motion.button>
        )}
        {status === 'sent' && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 10, backgroundColor: 'var(--surface2)' }}>
            Envoyée
          </span>
        )}
        {status === 'received' && (
          <>
            <motion.button whileTap={{ scale: 0.93 }} onClick={onAccept}
              style={{
                padding: '7px 14px', borderRadius: 10, border: 'none',
                backgroundColor: '#D1FAE5', color: '#059669',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}>
              Accepter
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={onDecline}
              style={{
                padding: '7px 10px', borderRadius: 10, border: 'none',
                backgroundColor: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}>
              Refuser
            </motion.button>
          </>
        )}
        {status === 'friend' && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#059669', padding: '7px 14px', borderRadius: 10, backgroundColor: '#D1FAE5' }}>
            ✓ Ami
          </span>
        )}
      </div>
    </div>
  )
}

// ── Friendship row ────────────────────────────────────────
function FriendshipRow({
  fr, isLast, type, onAccept, onDelete,
}: {
  fr:       FriendRequest
  isLast:   boolean
  type:     'friend' | 'received' | 'sent'
  onAccept?: () => void
  onDelete?: () => void
}) {
  const name = fr.friend.username || fr.friend.fullName || 'Utilisateur'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={fr.friend} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
            {name}
          </p>
          {type === 'friend' && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '1px 0 0', transition: 'color 0.25s ease' }}>
              {fr.friend.stampCount} stamp{fr.friend.stampCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {type === 'received' && onAccept && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={onAccept}
            style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              backgroundColor: '#D1FAE5', color: '#059669',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}>
            Accepter
          </motion.button>
        )}
        {(type === 'sent' || type === 'received') && onDelete && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={onDelete}
            style={{
              padding: '7px 10px', borderRadius: 10, border: 'none',
              backgroundColor: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}>
            {type === 'sent' ? 'Annuler' : 'Refuser'}
          </motion.button>
        )}
        {type === 'friend' && onDelete && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={onDelete}
            style={{
              padding: '7px 10px', borderRadius: 10, border: 'none',
              backgroundColor: 'transparent', color: '#EF4444',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}>
            Retirer
          </motion.button>
        )}
      </div>
    </div>
  )
}
