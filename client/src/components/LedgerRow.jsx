import { MessageCircle } from 'lucide-react'
import StampBadge from './StampBadge.jsx'
import { buildWhatsAppConfirmLink } from '../utils/whatsapp.js'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function LedgerRow({ entry, workerName }) {
  const { t } = useLanguage()
  const confirmUrl = `${window.location.origin}/confirm/${entry.id}`
  const waLink = buildWhatsAppConfirmLink(entry, workerName, confirmUrl)
  const earnings = entry.totalAmount ?? entry.hours * (entry.wagePerHour || 0)

  return (
    <div className="ledger-spine flex items-center gap-4 pl-5 py-3 border-b border-maroon/15 last:border-b-0">
      <div className="w-20 shrink-0 font-mono text-xs text-ink/60">{entry.date}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink text-sm truncate">{entry.employerName}</div>
        <div className="text-ink/60 text-xs">
          {entry.hours} {t('ledger.hours')} {entry.wagePerHour ? `· ₹${earnings} ${t('ledger.earned')}` : ''}
        </div>
      </div>
      <StampBadge status={entry.status} size="sm" />
      {entry.status === 'pending' && (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="focus-ring shrink-0 hover:opacity-70"
        >
          <MessageCircle size={18} className="text-stamp-amber" />
        </a>
      )}
    </div>
  )
}
