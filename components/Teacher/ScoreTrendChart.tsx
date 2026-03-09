'use client'

import styles from './Teacher.module.css'

interface DataPoint {
  date: Date
  score: number
  passed: boolean
}

interface ScoreTrendChartProps {
  data: DataPoint[]
  passingScore?: number
  height?: number
}

export default function ScoreTrendChart({ data, passingScore = 75, height = 140 }: ScoreTrendChartProps) {
  if (data.length === 0) return null

  const width = 500
  const padding = { top: 20, right: 30, bottom: 35, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = 100

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
    const y = padding.top + chartH - (d.score / maxVal) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  const passLineY = padding.top + chartH - (passingScore / maxVal) * chartH

  const formatDate = (d: Date) => {
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className={styles.chartContainer}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Score trend chart">
        <defs>
          <linearGradient id="scoreTrendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={padding.top + chartH - (val / maxVal) * chartH}
              x2={padding.left + chartW}
              y2={padding.top + chartH - (val / maxVal) * chartH}
              stroke="rgba(26,26,26,0.08)"
              strokeWidth="0.6"
            />
            <text
              x={padding.left - 8}
              y={padding.top + chartH - (val / maxVal) * chartH + 4}
              textAnchor="end"
              fontSize="9"
              fill="rgba(26,26,26,0.4)"
            >
              {val}
            </text>
          </g>
        ))}

        {/* Passing threshold dashed line */}
        <line
          x1={padding.left}
          y1={passLineY}
          x2={padding.left + chartW}
          y2={passLineY}
          stroke="#16a34a"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.5"
        />
        <text
          x={padding.left + chartW + 4}
          y={passLineY + 3}
          fontSize="8"
          fill="#16a34a"
          fontWeight="600"
        >
          Pass
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#scoreTrendGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={p.passed ? '#16a34a' : '#dc2626'}
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {/* Date labels */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0 || i === data.length - 1).map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 5}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(26,26,26,0.5)"
          >
            {formatDate(p.date)}
          </text>
        ))}
      </svg>
    </div>
  )
}
