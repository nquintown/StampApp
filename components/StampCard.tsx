'use client'

import { motion } from 'framer-motion'
import StampShape from './StampShape'
import type { Stamp } from '@/lib/types'

interface StampCardProps {
  stamp: Stamp
  onClick?: () => void
  size?: 'small' | 'medium' | 'large'
  showTitle?: boolean
  layoutId?: string
}

const sizeMap = {
  small: { width: 90, height: 110 },
  medium: { width: 140, height: 175 },
  large: { width: 200, height: 250 },
}

export default function StampCard({
  stamp,
  onClick,
  size = 'medium',
  showTitle = false,
  layoutId,
}: StampCardProps) {
  const dims = sizeMap[size]

  return (
    <motion.div
      layoutId={layoutId}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="inline-flex flex-col items-center cursor-pointer select-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <StampShape
        imageUrl={stamp.thumbnailUrl || stamp.imageUrl}
        alt={stamp.title}
        width={dims.width}
        height={dims.height}
        dominantColor={stamp.dominantColor}
      />
      {showTitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            maxWidth: dims.width,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {stamp.title}
        </motion.p>
      )}
    </motion.div>
  )
}
