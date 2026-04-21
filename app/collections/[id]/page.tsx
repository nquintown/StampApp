'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'
import StampCard from '@/components/StampCard'
import FAB from '@/components/FAB'
import ContextMenuSheet from '@/components/ContextMenuSheet'
import RenameSheet from '@/components/RenameSheet'
import { preGrantGyroPermission } from '@/lib/gyro'
import {
  fetchCollectionMembersWithProfiles,
  fetchCollectionOwner,
  insertCollectionMember,
  removeCollectionMember,
  fetchCollectionAllStamps,
  type CollectionMember,
} from '@/lib/stamps-db'
import type { Stamp } from '@/lib/types'
import { getFriends, type FriendUser } from '@/lib/friends-db'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
}

// ── Small avatar ──────────────────────────────────────────
function MemberAvatar({ member, size = 44 }: { member: CollectionMember | FriendUser; size?: number }) {
  const email  = 'email' in member ? member.email : null
  const name   = member.username || member.fullName || (email ? email.split('@')[0] : null) || 'U'
  const letter = name.charAt(0).toUpperCase()
  const url    = member.avatarUrl

  return url ? (
    <img src={url} alt={String(name)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
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

// ── Members sheet ─────────────────────────────────────────
function MembersSheet({
  visible,
  onClose,
  collectionId,
  collectionName,
  meId,
}: {
  visible:        boolean
  onClose:        () => void
  collectionId:   string
  collectionName: string
  meId:           string
}) {
  const [members,    setMembers]    = useState<CollectionMember[]>([])
  const [ownerId,    setOwnerId]    = useState<string | null>(null)
  const [friends,    setFriends]    = useState<FriendUser[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [removing,   setRemoving]   = useState<string | null>(null)
  const [adding,     setAdding]     = useState<string | null>(null)

  const isOwner = ownerId === meId

  const load = useCallback(async () => {
    setLoading(true)
    const [mems, owner, friendList] = await Promise.all([
      fetchCollectionMembersWithProfiles(collectionId),
      fetchCollectionOwner(collectionId),
      getFriends(meId),
    ])
    setMembers(mems)
    setOwnerId(owner)
    // Filter out friends who are already members
    const memberIds = new Set(mems.map((m) => m.userId))
    setFriends(friendList.filter((f) => !memberIds.has(f.userId)))
    setLoading(false)
  }, [collectionId, meId])

  useEffect(() => {
    if (visible) { load(); setShowInvite(false) }
  }, [visible, load])

  const handleRemove = async (userId: string) => {
    setRemoving(userId)
    try {
      await removeCollectionMember(collectionId, userId)
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
      setFriends((prev) => {
        // Re-add to friends list if they're a friend
        return prev
      })
    } finally {
      setRemoving(null)
    }
  }

  const handleAdd = async (friend: FriendUser) => {
    setAdding(friend.userId)
    try {
      await insertCollectionMember(collectionId, friend.userId, meId)
      const newMember: CollectionMember = {
        userId:    friend.userId,
        username:  friend.username ?? null,
        fullName:  friend.fullName ?? null,
        avatarUrl: friend.avatarUrl ?? null,
        email:     friend.email ?? null,
        invitedBy: meId,
      }
      setMembers((prev) => [...prev, newMember])
      setFriends((prev) => prev.filter((f) => f.userId !== friend.userId))
    } finally {
      setAdding(null)
    }
  }

  const memberName = (m: CollectionMember) =>
    m.username || m.fullName || (m.email ? m.email.split('@')[0] : 'Utilisateur')

  const friendName = (f: FriendUser) =>
    f.username || f.fullName || f.email?.split('@')[0] || 'Utilisateur'

  if (!visible) return null

  return (
    <>
      {/* Backdrop — z-index above FAB (101) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Centering wrapper — avoids transform conflict with framer-motion y */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        zIndex: 201, pointerEvents: 'none',
      }}>
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          style={{
            width: '100%', maxWidth: 430,
            backgroundColor: 'var(--surface)',
            borderRadius: '24px 24px 0 0',
            paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            pointerEvents: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', transition: 'color 0.25s ease' }}>
              Membres
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, transition: 'color 0.25s ease' }}>
              {collectionName}
            </p>
          </div>
          {isOwner && !showInvite && friends.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInvite(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.25s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <circle cx="7" cy="6" r="2.8" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1.5 16c0-3 2.6-5 5.5-5M13 9v6M10 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Inviter
            </motion.button>
          )}
          {showInvite && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInvite(false)}
              style={{
                padding: '8px 14px', borderRadius: 12,
                backgroundColor: 'var(--surface2)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retour
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          ) : showInvite ? (
            /* ── Invite view ─────────────────────── */
            <div style={{ paddingBottom: 20 }}>
              {friends.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                  Tous tes amis sont déjà membres.
                </p>
              ) : (
                <div style={{
                  backgroundColor: 'var(--bg)', borderRadius: 16,
                  border: '1px solid var(--border)', overflow: 'hidden',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}>
                  {friends.map((f, i) => (
                    <div key={f.userId} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < friends.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <MemberAvatar member={f} />
                        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
                          {friendName(f)}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleAdd(f)}
                        disabled={adding === f.userId}
                        style={{
                          padding: '7px 14px', borderRadius: 10, border: 'none',
                          backgroundColor: adding === f.userId ? 'var(--surface2)' : 'var(--text-primary)',
                          color: adding === f.userId ? 'var(--text-secondary)' : 'var(--bg)',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          WebkitTapHighlightColor: 'transparent',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {adding === f.userId ? '…' : 'Ajouter'}
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Members list ────────────────────── */
            <div style={{ paddingBottom: 20 }}>
              {members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                    Aucun membre pour l&apos;instant.
                  </p>
                  {isOwner && friends.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowInvite(true)}
                      style={{
                        padding: '11px 24px', borderRadius: 14,
                        backgroundColor: 'var(--text-primary)', color: 'var(--bg)',
                        border: 'none', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'background-color 0.25s ease',
                      }}
                    >
                      Inviter des amis
                    </motion.button>
                  )}
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'var(--bg)', borderRadius: 16,
                  border: '1px solid var(--border)', overflow: 'hidden',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}>
                  <AnimatePresence initial={false}>
                    {members.map((m, i) => (
                      <motion.div
                        key={m.userId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <MemberAvatar member={m} />
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
                              {memberName(m)}
                            </p>
                            {m.username && m.fullName && (
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '1px 0 0', transition: 'color 0.25s ease' }}>
                                @{m.username}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Remove button — only for owner */}
                        {isOwner && (
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => handleRemove(m.userId)}
                            disabled={removing === m.userId}
                            style={{
                              padding: '7px 12px', borderRadius: 10, border: 'none',
                              backgroundColor: 'transparent', color: '#EF4444',
                              fontSize: 13, fontWeight: 500, cursor: 'pointer',
                              fontFamily: 'inherit',
                              WebkitTapHighlightColor: 'transparent',
                              opacity: removing === m.userId ? 0.5 : 1,
                            }}
                          >
                            {removing === m.userId ? '…' : 'Retirer'}
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
        </motion.div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function CollectionPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router  = useRouter()
  const { user, collections, stamps, loading, loadStamps, renameCollection, deleteCollection } = useStore()

  const [menuOpen,        setMenuOpen]        = useState(false)
  const [renameOpen,      setRenameOpen]      = useState(false)
  const [membersOpen,     setMembersOpen]     = useState(false)
  const [isDeleting,      setIsDeleting]      = useState(false)
  const [allStamps,       setAllStamps]       = useState<Stamp[] | null>(null)
  const [memberProfiles,  setMemberProfiles]  = useState<Map<string, { username: string | null; fullName: string | null; avatarUrl: string | null; email: string | null }>>(new Map())

  // Load stamps if not yet loaded (direct URL access / page refresh)
  useEffect(() => {
    if (!loading && stamps.length === 0 && collections.length === 0) {
      loadStamps()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const collection = collections.find((c) => c.id === id)
  const isVirtual  = id === 'all'

  // For specific (non-virtual) collections, fetch ALL members' stamps via DB
  useEffect(() => {
    if (isVirtual) { setAllStamps(null); return }
    fetchCollectionAllStamps(id).then(setAllStamps)
    fetchCollectionMembersWithProfiles(id).then((members) => {
      const map = new Map(members.map((m) => [m.userId, { username: m.username, fullName: m.fullName, avatarUrl: m.avatarUrl, email: m.email }]))
      setMemberProfiles(map)
    })
  }, [id, isVirtual])

  // Refresh when own stamps change (e.g. new stamp added)
  useEffect(() => {
    if (isVirtual) return
    fetchCollectionAllStamps(id).then(setAllStamps)
  }, [stamps.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const collectionStamps = isVirtual
    ? stamps                                              // "All stamps" = own stamps only
    : (allStamps ?? stamps.filter((s) => s.collectionId === id)) // shared collection = DB fetch

  const menuItems = [
    {
      label: 'Membres',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 15C1.5 12.5 4 10.5 7 10.5C10 10.5 12.5 12.5 12.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="13.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M14 11C15.5 11.2 16.5 12.5 16.5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      noAutoClose: true,
      onPress: () => { setMenuOpen(false); setTimeout(() => setMembersOpen(true), 220) },
    },
    {
      label: 'Renommer',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 12.5V15h2.5l7.37-7.37-2.5-2.5L3 12.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M12.88 4.12a1.77 1.77 0 0 1 2.5 2.5l-1.25-1.25-1.25-1.25Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
      noAutoClose: true,
      onPress: () => { setMenuOpen(false); setTimeout(() => setRenameOpen(true), 220) },
    },
    {
      label: 'Partager',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M13 3L17 7L13 11V8.5C8 8.5 5 10.5 4 15C3.5 11 5 6 13 5.5V3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
      onPress: () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({ title: collection?.name ?? 'Collection', text: `Regarde ma collection "${collection?.name}" sur Stamply !` })
            .catch(() => {})
        }
      },
    },
    {
      label: 'Supprimer la collection',
      destructive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 5H15M7 5V3H11V5M6 5V14C6 14.5 6.5 15 7 15H11C11.5 15 12 14.5 12 14V5H6Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onPress: () => {
        setIsDeleting(true)
        setTimeout(() => {
          deleteCollection(id)
          router.back()
        }, 300)
      },
    },
  ]

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', paddingBottom: 100 }}>
        <TopBar
          title="Collection"
          leftSlot={
            <IconButton label="Retour" onClick={() => router.back()}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
          }
        />
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ height: 13, width: 70, borderRadius: 6, backgroundColor: 'var(--surface2)', marginBottom: 20, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '3/4', borderRadius: 16, backgroundColor: 'var(--surface2)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -20 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          paddingBottom: 100,
          transition: 'background-color 0.25s ease',
        }}
      >
        <TopBar
          title={collection?.name ?? 'Collection'}
          leftSlot={
            <IconButton label="Retour" onClick={() => router.back()}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
          }
          rightSlot={
            !isVirtual ? (
              <IconButton label="Options" onClick={() => setMenuOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </IconButton>
            ) : undefined
          }
        />

        <div style={{ padding: '4px 20px 0' }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500, transition: 'color 0.25s ease' }}
          >
            {collectionStamps.length} {collectionStamps.length === 1 ? 'stamp' : 'stamps'}
          </motion.p>

          {collectionStamps.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
            >
              {collectionStamps.map((stamp) => (
                <motion.div key={stamp.id} variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <StampCard
                    stamp={stamp}
                    size="small"
                    showTitle
                    onClick={async () => { await preGrantGyroPermission(); router.push(`/stamps/${stamp.id}`) }}
                    layoutId={`stamp-col-${stamp.id}`}
                  />
                  {stamp.ownerId && stamp.ownerId !== user?.id && (() => {
                    const p = memberProfiles.get(stamp.ownerId)
                    const name = p?.username || p?.fullName || (p?.email ? p.email.split('@')[0] : '?')
                    return (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: '50%',
                        backgroundColor: 'var(--text-primary)',
                        border: '2px solid var(--bg)',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        zIndex: 2,
                      }}>
                        {p?.avatarUrl
                          ? <img src={p.avatarUrl} alt={String(name)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--bg)', lineHeight: 1 }}>{String(name).charAt(0).toUpperCase()}</span>
                        }
                      </div>
                    )
                  })()}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                paddingTop: 80, gap: 12,
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)',
                transition: 'background-color 0.25s ease',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M3 7.5C3 6.12 4.12 5 5.5 5H11L13 7.5H22.5C23.88 7.5 25 8.62 25 10V21C25 22.38 23.88 23.5 22.5 23.5H5.5C4.12 23.5 3 22.38 3 21V7.5Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 12.5V18.5M11 15.5H17"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, transition: 'color 0.25s ease' }}>
                Aucun stamp ici
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', margin: 0, transition: 'color 0.25s ease' }}>
                Ajoute un stamp et assigne-le à cette collection
              </p>
            </motion.div>
          )}
        </div>

        <FAB onCamera={() => router.push(isVirtual ? '/camera' : `/camera?collectionId=${id}`)} />

        {/* Action sheet */}
        <ContextMenuSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          title={collection?.name}
        />

        {/* Rename sheet */}
        <RenameSheet
          visible={renameOpen}
          onClose={() => setRenameOpen(false)}
          currentName={collection?.name ?? ''}
          label="collection"
          onConfirm={(newName) => renameCollection(id, newName)}
        />

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </motion.div>

      {/* Members sheet — outside motion.div to avoid z-index issues */}
      <AnimatePresence>
        {membersOpen && (
          <MembersSheet
            visible={membersOpen}
            onClose={() => setMembersOpen(false)}
            collectionId={id}
            collectionName={collection?.name ?? 'Collection'}
            meId={user?.id ?? ''}
          />
        )}
      </AnimatePresence>
    </>
  )
}
