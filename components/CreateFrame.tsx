'use client'

import { motion } from 'framer-motion'

interface CreateFrameProps {
  isProcessing?: boolean
  selectedImage?: string | null
}

export default function CreateFrame({
  isProcessing = false,
  selectedImage,
}: CreateFrameProps) {
  return (
    <motion.div
      animate={{
        y: isProcessing ? 0 : [0, -8, 0],
        scale: isProcessing ? [1, 1.03, 1] : 1,
      }}
      transition={
        isProcessing
          ? {
              scale: {
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {
              y: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
      style={{
        position: 'relative',
        width: 240,
        height: 300,
        borderRadius: 28,
        background:
          'linear-gradient(160deg, #F0EBE0 0%, #E8E0D0 40%, #DDD4C0 100%)',
        boxShadow: [
          '0 24px 60px rgba(0,0,0,0.22)',
          '0 8px 20px rgba(0,0,0,0.16)',
          '0 2px 6px rgba(0,0,0,0.10)',
          'inset 0 1px 1px rgba(255,255,255,0.6)',
          'inset 0 -1px 1px rgba(0,0,0,0.05)',
        ].join(', '),
      }}
    >
      {/* Device body detail - top ridge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(0,0,0,0.12)',
        }}
      />

      {/* Small indicator dots */}
      <div
        style={{
          position: 'absolute',
          top: 22,
          right: 18,
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <motion.div
          animate={{ opacity: isProcessing ? [1, 0.3, 1] : 1 }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: isProcessing ? '#4ADE80' : '#A0C878',
            boxShadow: isProcessing ? '0 0 6px #4ADE80' : 'none',
          }}
        />
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {/* Main lens/opening */}
      <motion.div
        animate={
          isProcessing
            ? { boxShadow: ['0 0 0px transparent', '0 0 20px rgba(96,165,250,0.6)', '0 0 0px transparent'] }
            : {}
        }
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 180,
          height: 220,
          borderRadius: 16,
          backgroundColor: '#1A1A18',
          overflow: 'hidden',
          boxShadow:
            'inset 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        {selectedImage ? (
          <img
            src={selectedImage}
            alt="Selected"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9,
            }}
          />
        ) : (
          <motion.div
            animate={{
              opacity: isProcessing ? [0.5, 1, 0.5] : [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {/* Scan lines */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.08 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: '#60A5FA',
                    top: `${(i + 1) * 12.5}%`,
                  }}
                />
              ))}
            </div>
            {/* Center icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M8 14V10C8 8.9 8.9 8 10 8H14M26 8H30C31.1 8 32 8.9 32 10V14M32 26V30C32 31.1 31.1 32 30 32H26M14 32H10C8.9 32 8 31.1 8 30V26"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="20"
                cy="20"
                r="6"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
            </svg>
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {isProcessing ? 'Scanning...' : 'Select below'}
            </p>
          </motion.div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, transparent 0%, rgba(96,165,250,0.15) 50%, transparent 100%)',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 40,
                background:
                  'linear-gradient(180deg, transparent, rgba(96,165,250,0.4), transparent)',
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Bottom detail */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 20,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
        <div
          style={{
            width: 20,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {/* Side ridges */}
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            top: '30%',
            [side === -1 ? 'left' : 'right']: -3,
            width: 3,
            height: 60,
            borderRadius: side === -1 ? '2px 0 0 2px' : '0 2px 2px 0',
            backgroundColor: 'rgba(0,0,0,0.12)',
          }}
        />
      ))}
    </motion.div>
  )
}
