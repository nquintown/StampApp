'use client'

import React, { useId } from 'react'

interface StampShapeProps {
  imageUrl: string
  alt?: string
  width?: number
  height?: number
  className?: string
  dominantColor?: string
}

/**
 * Generates the exact stamp outline from the reference SVG:
 * - Sharp right-angle corners (no rounding)
 * - Semicircular perforations going INWARD on all 4 sides
 * - Each arc is two quarter-circles (counter-clockwise = sweep=0)
 *
 * The path uses coordinates (0,0)→(W,H) and clips the image to this shape.
 */
export function generateStampPath(W: number, H: number, r: number): string {
  // period/r = 35/10 = 3.5  (from the reference SVG dimensions)
  const period = r * 3.5

  function centers(len: number): number[] {
    const n = Math.max(1, Math.round(len / period))
    const stp = len / n
    return Array.from({ length: n }, (_, i) => (i + 0.5) * stp)
  }

  const topC    = centers(W)
  const rightC  = centers(H)
  const bottomC = centers(W).reverse()
  const leftC   = centers(H).reverse()

  const d: string[] = ['M 0 0']

  // Top edge → going RIGHT, bumps go DOWN (inward)
  topC.forEach(cx =>
    d.push(`L ${cx - r} 0 A ${r} ${r} 0 0 0 ${cx} ${r} A ${r} ${r} 0 0 0 ${cx + r} 0`)
  )
  d.push(`L ${W} 0`)

  // Right edge → going DOWN, bumps go LEFT (inward)
  rightC.forEach(cy =>
    d.push(`L ${W} ${cy - r} A ${r} ${r} 0 0 0 ${W - r} ${cy} A ${r} ${r} 0 0 0 ${W} ${cy + r}`)
  )
  d.push(`L ${W} ${H}`)

  // Bottom edge → going LEFT, bumps go UP (inward)
  bottomC.forEach(cx =>
    d.push(`L ${cx + r} ${H} A ${r} ${r} 0 0 0 ${cx} ${H - r} A ${r} ${r} 0 0 0 ${cx - r} ${H}`)
  )
  d.push(`L 0 ${H}`)

  // Left edge → going UP, bumps go RIGHT (inward)
  leftC.forEach(cy =>
    d.push(`L 0 ${cy + r} A ${r} ${r} 0 0 0 ${r} ${cy} A ${r} ${r} 0 0 0 0 ${cy - r}`)
  )

  d.push('Z')
  return d.join(' ')
}

export default function StampShape({
  imageUrl,
  alt = 'Stamp',
  width = 260,
  height = 320,
  className = '',
}: StampShapeProps) {
  const uid    = useId().replace(/:/g, '')
  const clipId = `stamp-clip-${uid}`

  // r scaled from reference SVG: r/minDim ≈ 10/298 ≈ 3.4%
  const r = Math.max(4, Math.min(16, Math.round(Math.min(width, height) * 0.034)))

  const path = generateStampPath(width, height, r)

  // Small pad so the drop-shadow isn't clipped by the container
  const pad = 6

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width, height, overflow: 'visible' }}
    >
      {/* Invisible SVG — defines the clip path */}
      <svg width={0} height={0} style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {/* No transform needed: bumps are inward so the path fits exactly in (0,0)→(W,H) */}
            <path d={path} />
          </clipPath>
        </defs>
      </svg>

      {/* Shadow wrapper — drop-shadow follows the clipped stamp outline */}
      <div
        style={{
          position: 'absolute',
          top: -pad,
          left: -pad,
          width: width + pad * 2,
          height: height + pad * 2,
          filter: 'none',
          pointerEvents: 'none',
        }}
      >
        {/* Clipped image — same size as the stamp, offset to undo the pad */}
        <div
          style={{
            position: 'absolute',
            top: pad,
            left: pad,
            width,
            height,
            clipPath: `url(#${clipId})`,
            overflow: 'hidden',
          }}
        >
          <img
            src={imageUrl}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
