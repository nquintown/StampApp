'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import CreateFrame from '@/components/CreateFrame'
import { demoImages } from '@/lib/mockData'
import type { Stamp } from '@/lib/types'

type Stage = 'select' | 'processing' | 'name'

export default function CreatePage() {
  const router = useRouter()
  const { addStamp } = useStore()
  const [stage, setStage] = useState<Stage>('select')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  const handleCapture = () => {
    if (!selectedImage) return
    setStage('processing')
    setTimeout(() => {
      setStage('name')
    }, 1800)
  }

  const handleSave = () => {
    if (!selectedImage || !title.trim()) return
    const id = `stamp-${Date.now()}`
    const stamp: Stamp = {
      id,
      title: title.trim(),
      imageUrl: selectedImage,
      thumbnailUrl: selectedImage,
      createdAt: new Date().toISOString(),
      sourceType: 'camera',
      sourceLabel: 'Created',
      collectionId: 'all',
      tags: [],
      dominantColor: '#60A5FA',
      favorite: false,
    }
    addStamp(stamp)
    router.push('/')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      style={{
        minHeight: '100vh',
        backgroundColor: '#1A1A18',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background subtle grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          zIndex: 10,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#F7F4ED',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>

        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(247,244,237,0.9)',
            letterSpacing: '-0.2px',
          }}
        >
          {stage === 'name' ? 'Name your stamp' : 'New Stamp'}
        </span>

        <div style={{ width: 36 }} />
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          gap: 32,
          zIndex: 10,
        }}
      >
        <AnimatePresence mode="wait">
          {(stage === 'select' || stage === 'processing') && (
            <motion.div
              key="frame"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}
            >
              <CreateFrame
                isProcessing={stage === 'processing'}
                selectedImage={selectedImage}
              />

              {stage !== 'processing' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: 14,
                    color: 'rgba(247,244,237,0.5)',
                    textAlign: 'center',
                    letterSpacing: '0.02em',
                  }}
                >
                  {selectedImage
                    ? 'Looking good! Tap Save Stamp to capture'
                    : 'Select a photo from the gallery below'}
                </motion.p>
              )}

              {stage === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#60A5FA',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(247,244,237,0.5)' }}>
                    Stamping...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {stage === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                width: '100%',
                maxWidth: 340,
              }}
            >
              {/* Preview stamp */}
              {selectedImage && (
                <div
                  style={{
                    width: 160,
                    height: 200,
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    border: '3px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ width: '100%' }}>
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(247,244,237,0.5)',
                    marginBottom: 10,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Stamp Title
                </p>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your stamp a name..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F7F4ED',
                    fontSize: 16,
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && title.trim()) handleSave()
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <AnimatePresence>
        {stage === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{
              padding: '0 0 24px',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              zIndex: 10,
            }}
          >
            {/* Demo images horizontal scroll */}
            <p
              style={{
                fontSize: 12,
                color: 'rgba(247,244,237,0.4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 12,
                paddingLeft: 24,
              }}
            >
              Select photo
            </p>
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                padding: '4px 24px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="scrollbar-hide"
            >
              {demoImages.map((img) => (
                <motion.button
                  key={img.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedImage(img.url)}
                  style={{
                    flexShrink: 0,
                    width: 72,
                    height: 90,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: selectedImage === img.url
                      ? '2.5px solid #60A5FA'
                      : '2.5px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none',
                    boxShadow: selectedImage === img.url
                      ? '0 0 0 1px #60A5FA, 0 4px 12px rgba(96,165,250,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <img
                    src={img.url}
                    alt="Photo option"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    loading="lazy"
                  />
                </motion.button>
              ))}
            </div>

            {/* CTA button */}
            <div style={{ padding: '20px 24px 0' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCapture}
                disabled={!selectedImage}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 50,
                  backgroundColor: selectedImage ? '#F7F4ED' : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: selectedImage ? '#1E1E1C' : 'rgba(255,255,255,0.4)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: selectedImage ? 'pointer' : 'default',
                  letterSpacing: '-0.2px',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.25s, color 0.25s',
                  fontFamily: 'inherit',
                }}
              >
                Save Stamp
              </motion.button>
            </div>
          </motion.div>
        )}

        {stage === 'name' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: '0 24px 32px',
              paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
              zIndex: 10,
            }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 50,
                backgroundColor: title.trim() ? '#F7F4ED' : 'rgba(255,255,255,0.15)',
                border: 'none',
                color: title.trim() ? '#1E1E1C' : 'rgba(255,255,255,0.4)',
                fontSize: 16,
                fontWeight: 700,
                cursor: title.trim() ? 'pointer' : 'default',
                letterSpacing: '-0.2px',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.25s, color 0.25s',
                fontFamily: 'inherit',
              }}
            >
              Add to Collection
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
