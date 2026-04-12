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
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

export default function GridPage() {
  const router = useRouter()
  const { stamps } = useStore()

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
        title="Tous les Stamps"
        leftSlot={
          <IconButton label="Retour" onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 4L6 9L11 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </IconButton>
        }
        rightSlot={
          <IconButton label="Trier">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 5h12M5 9h8M7 13h4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        }
      />

      <div style={{ padding: '4px 20px 0' }}>
        {/* Count label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          {stamps.length} stamps
        </motion.p>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {stamps.map((stamp) => (
            <motion.div
              key={stamp.id}
              variants={itemVariants}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <StampCard
                stamp={stamp}
                size="small"
                showTitle
                onClick={async () => { await preGrantGyroPermission(); router.push(`/stamps/${stamp.id}`) }}
                layoutId={`stamp-grid-${stamp.id}`}
              />
            </motion.div>
          ))}
        </motion.div>

        {stamps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 80,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: 'var(--surface2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="4" width="20" height="20" rx="4"
                  stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 10V18M10 14H18"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Aucun stamp pour l&apos;instant
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Appuie sur + pour créer ton premier stamp
            </p>
          </motion.div>
        )}
      </div>

      <FAB
        onCamera={() => router.push('/camera')}
        onGallery={() => router.push('/camera?source=gallery')}
      />
    </motion.div>
  )
}
