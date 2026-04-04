'use client'

import { motion } from 'framer-motion'

// ── Frame render dimensions ────────────────────────────────
export const FW = 280   // rendered width  (px)
export const FH = 382   // rendered height (px)
export const FR = 26    // outer corner radius (for glow layer)

// ── Opening dimensions ─────────────────────────────────────
// Calibrated against stamp-tool.png proportions:
//   opening width  ≈ 69 % of frame width
//   opening height ≈ 63 % of frame height
//   top margin     ≈ 22 %  (more space at top due to hinge)
//   bottom margin  ≈ 15 %  (bottom bracket)
export const OW = 193                // opening width  (px)
export const OH = 242                // opening height (px)
export const OX = (FW - OW) / 2     // horizontally centred = 43.5
export const OY = 84                 // visual top of opening (px from top of frame)
export const OR = 6                  // opening corner radius

// Vertical offset between the frame centre and the opening centre.
// Used by the adjust stage to shift the frame so that the OPENING centre
// sits exactly at screen centre → handleCut crop math stays exact.
export const OY_OFFSET = OY + OH / 2 - FH / 2   // = 84 + 121 - 191 = 14 px

// ── Component ─────────────────────────────────────────────
interface CameraStampFrameProps {
  isProcessing?: boolean
  capturedImage?: string | null
}

export default function CameraStampFrame({
  isProcessing = false,
  capturedImage,
}: CameraStampFrameProps) {
  return (
    <div style={{ perspective: '900px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.76, y: -38, rotateX: -22 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
        transition={{
          opacity: { duration: 0.38 },
          scale:   { type: 'spring', stiffness: 290, damping: 26 },
          rotateX: { type: 'spring', stiffness: 290, damping: 26, delay: 0.04 },
        }}
        style={{ position: 'relative', width: FW, height: FH, flexShrink: 0 }}
      >

        {/* Captured image — sits BEHIND the PNG */}
        {capturedImage && (
          <div style={{
            position: 'absolute',
            left: OX, top: OY,
            width: OW, height: OH,
            borderRadius: OR,
            overflow: 'hidden',
            zIndex: 1,
          }}>
            <img
              src={capturedImage}
              alt="Captured"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* stamp-tool.png — the transparent opening lets what's behind show through */}
        {/* File must be placed at: /public/stamp-tool.png */}
        <img
          src="/stamp-tool.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%', height: '100%',
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Processing flash ring */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: OX - 2, top: OY - 2,
              width: OW + 4, height: OH + 4,
              borderRadius: OR + 2,
              border: '2.5px solid rgba(255,255,255,0.95)',
              boxShadow: '0 0 14px rgba(255,255,255,0.75), inset 0 0 10px rgba(255,255,255,0.45)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        )}

      </motion.div>
    </div>
  )
}
