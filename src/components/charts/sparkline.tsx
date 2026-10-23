import { useState } from 'react'

import { formatCurrency } from '@/lib/format'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
}

export function Sparkline({ values, width = 84, height = 24 }: SparklineProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  if (values.length < 2) return null

  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const x = (i: number) => (i / (values.length - 1)) * width
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const up = (values[values.length - 1] ?? 0) >= (values[0] ?? 0)
  const hoveredValue = hovered === null ? undefined : values[hovered]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend ${up ? 'up' : 'down'}, last ${values.length} days`}
      className={up ? 'text-gain' : 'text-loss'}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = (event.clientX - rect.left) / rect.width
        setHovered(Math.min(values.length - 1, Math.max(0, Math.round(ratio * (values.length - 1)))))
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {hovered !== null && hoveredValue !== undefined && (
        <>
          <circle cx={x(hovered)} cy={y(hoveredValue)} r="2.5" fill="currentColor" />
          <text data-sparkline-tip x={hovered > values.length / 2 ? 2 : width - 2} y="9" textAnchor={hovered > values.length / 2 ? 'start' : 'end'} fontSize="9" className="fill-foreground">
            {formatCurrency(hoveredValue)}
          </text>
        </>
      )}
    </svg>
  )
}
