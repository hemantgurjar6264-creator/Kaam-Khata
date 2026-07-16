import { useLanguage } from '../context/LanguageContext.jsx'

const CLASS = {
  pending: 'stamp-pending',
  confirmed: 'stamp-confirmed',
  disputed: 'stamp-disputed',
}

export default function StampBadge({ status, size = 'md' }) {
  const { t } = useLanguage()
  const cls = CLASS[status] || CLASS.pending
  const sizeCls =
    size === 'lg'
      ? 'px-5 py-2 text-sm'
      : size === 'sm'
      ? 'px-2.5 py-0.5 text-[10px]'
      : 'px-3.5 py-1 text-xs'
  return (
    <span className={`stamp ${cls} ${sizeCls} font-semibold whitespace-nowrap`}>
      {t(`status.${status}`)}
    </span>
  )
}
