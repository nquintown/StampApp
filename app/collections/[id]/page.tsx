'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import TopBar, { IconButton } from '@/components/TopBar'
import StampCard from '@/components/StampCard'
import FAB from '@/components/FAB'
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
  const router = useRouter()
  const { collections, stamps } = useStore()

  const collection = collections.find((c) => c.id === id)
  const collectionStamps = stamps.filter((s) => s.collectionId === id || id === 'all')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
          <IconButton label="Back" onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        }
      />

      <div style={{ padding: '4px 20px 0' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}
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
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M3 7.5C3 6.12 4.12 5 5.5 5H11L13 7.5H22.5C23.88 7.5 25 8.62 25 10V21C25 22.38 23.88 23.5 22.5 23.5H5.5C4.12 23.5 3 22.38 3 21V7.5Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M14 12.5V18.5M11 15.5H17"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              No stamps yet
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
              Add a stamp and assign it to this collection
            </p>
          </motion.div>
        )}
      </div>

      <FAB
        onCamera={() => router.push('/camera')}
        onGallery={() => router.push('/create')}
      />
    </motion.div>
  )
}
