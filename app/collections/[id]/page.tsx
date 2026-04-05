'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'
import StampCard from '@/components/StampCard'
import FAB from '@/components/FAB'
import ContextMenuSheet from '@/components/ContextMenuSheet'
import RenameSheet from '@/components/RenameSheet'
import { preGrantGyroPermission } from '@/lib/gyro'

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

export default function CollectionPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router  = useRouter()
  const { collections, stamps, renameCollection, deleteCollection } = useStore()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const collection       = collections.find((c) => c.id === id)
  const collectionStamps = stamps.filter((s) => s.collectionId === id || id === 'all')
  const isVirtual        = id === 'all'   // "All stamps" cannot be renamed/deleted

  const menuItems = [
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
          navigator.share({ title: collection?.name ?? 'Collection', text: `Regarde ma collection "${collection?.name}" sur Stampverse !` })
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

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isDeleting ? 0 : 1, y: isDeleting ? -20 : 0 }}
        exit={{ opacity: 0 }}
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
                <motion.div key={stamp.id} variants={itemVariants} style={{ display: 'flex', justifyContent: 'center' }}>
                  <StampCard
                    stamp={stamp}
                    size="small"
                    showTitle
                    onClick={async () => { await preGrantGyroPermission(); router.push(`/stamps/${stamp.id}`) }}
                    layoutId={`stamp-col-${stamp.id}`}
                  />
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

        <FAB
          onCamera={() => router.push('/camera')}
          onGallery={() => router.push('/create')}
        />

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
      </motion.div>
    </AnimatePresence>
  )
}
