import { Menu, Search, Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function Topbar({ search, onSearchChange, onMenuClick }) {
  const { lang, setLang, t } = useLanguage()
  const { user } = useAuth()

  const today = new Date()
  const dateLabel = today.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const weekdayLabel = today.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long' })

  return (
    <header className="sticky top-0 z-20 bg-ink/95 backdrop-blur border-b border-white/10">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button
          onClick={onMenuClick}
          className="focus-ring lg:hidden text-paper/70 hover:text-paper shrink-0"
          aria-label="Menu"
        >
          <Menu size={22} />
        </button>

        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paper/40" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('dash.searchPlaceholder')}
            className="focus-ring w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-paper placeholder:text-paper/40 outline-none"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          className="focus-ring hidden sm:flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-paper hover:bg-white/5 transition-colors shrink-0"
          title="Change language"
        >
          <Languages size={14} />
          {lang === 'hi' ? 'EN' : 'हिं'}
        </button>

        <div className="hidden md:block text-right shrink-0">
          <div className="text-paper text-sm font-medium">{dateLabel}</div>
          <div className="text-paper/45 text-xs">{weekdayLabel}</div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pl-1">
          <div className="w-9 h-9 rounded-full bg-stamp-amber/20 border border-stamp-amber/40 text-stamp-amber font-display flex items-center justify-center text-xs">
            {initials(user?.name) || '?'}
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-paper text-sm font-semibold truncate max-w-[9rem]">{user?.name}</div>
            <div className="text-paper/45 text-xs">
              {user?.role === 'employer' ? t('register.roleEmployer') : t('register.roleWorker')}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
