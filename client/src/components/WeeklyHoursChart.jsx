import { useLanguage } from '../context/LanguageContext.jsx'

const W = 640
const H = 220
const PAD_L = 34
const PAD_B = 24
const PAD_T = 14

export default function WeeklyHoursChart({ entries }) {
  const { t } = useLanguage()
  const weekdays = t('dash.weekdays')

  // Bucket hours by day-of-week for entries within the last 7 days.
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 6)
  cutoff.setHours(0, 0, 0, 0)

  const buckets = [0, 1, 2, 3, 4, 5, 6].map(() => 0)
  entries.forEach((e) => {
    const d = new Date(e.date)
    if (Number.isNaN(d.getTime()) || d < cutoff) return
    buckets[d.getDay()] += Number(e.hours) || 0
  })

  const max = Math.max(...buckets, 4)
  const plotW = W - PAD_L - 16
  const plotH = H - PAD_T - PAD_B
  const stepX = plotW / (buckets.length - 1)

  const points = buckets.map((v, i) => {
    const x = PAD_L + i * stepX
    const y = PAD_T + plotH - (v / max) * plotH
    return [x, y]
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${PAD_T + plotH} L${points[0][0]},${
    PAD_T + plotH
  } Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Weekly hours chart">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D98E2B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D98E2B" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g) => {
        const y = PAD_T + plotH - g * plotH
        return (
          <g key={g}>
            <line x1={PAD_L} y1={y} x2={W - 16} y2={y} stroke="#F0E6D2" strokeOpacity="0.06" />
            <text x={0} y={y + 4} fill="#F0E6D2" fillOpacity="0.4" fontSize="11">
              {Math.round(max * g)}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#D98E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#D98E2B" stroke="#141B30" strokeWidth="2" />
      ))}

      {weekdays.map((label, i) => (
        <text
          key={label + i}
          x={PAD_L + i * stepX}
          y={H - 4}
          fill="#F0E6D2"
          fillOpacity="0.5"
          fontSize="11"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}
