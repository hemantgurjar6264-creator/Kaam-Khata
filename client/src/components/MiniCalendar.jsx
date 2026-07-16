import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function MiniCalendar({ entries }) {
  const { t } = useLanguage()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const entryDates = new Set(entries.map((e) => e.date))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const hasEntry = (d) => {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return entryDates.has(iso)
  }

  const months = t('dash.months')
  const weekdaysShort = t('dash.weekdaysShort')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-paper text-base">
          {months[month]} {year}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="focus-ring text-paper/50 hover:text-paper p-1 rounded-lg hover:bg-white/5"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="focus-ring text-paper/50 hover:text-paper p-1 rounded-lg hover:bg-white/5"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdaysShort.map((w, i) => (
          <div key={i} className="text-paper/40 text-[11px] font-semibold py-1">
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-xs ${
                isToday(d)
                  ? 'bg-stamp-amber text-ink font-bold'
                  : 'text-paper/75 hover:bg-white/5'
              }`}
            >
              {d}
              {hasEntry(d) && !isToday(d) && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-stamp-green" />
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
