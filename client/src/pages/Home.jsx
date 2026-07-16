import { Link } from 'react-router-dom'
import {
  Camera,
  MessageCircleHeart,
  ScrollText,
  ArrowRight,
  Play,
  Users,
  Zap,
  ShieldCheck,
  Languages as LanguagesIcon,
  Mic,
  MessageCircle,
  Layers,
  Star,
  Sparkles,
  Gift,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import IndiaGlowGraphic from '../components/IndiaGlowGraphic.jsx'

const STEP_ICONS = [Camera, MessageCircleHeart, ScrollText]
const STAT_ICONS = [Users, Zap, ShieldCheck, LanguagesIcon]
const STAT_COLORS = ['text-stamp-green', 'text-stamp-amber', 'text-stamp-amber', 'text-stamp-amber']
const FEATURE_ICONS = [MessageCircle, Mic, MessageCircleHeart, Layers, Star, ScrollText]
const FEATURE_COLORS = [
  { icon: 'text-stamp-green', bg: 'bg-stamp-green/10' },
  { icon: 'text-maroon-light', bg: 'bg-maroon-light/10' },
  { icon: 'text-sky-400', bg: 'bg-sky-400/10' },
  { icon: 'text-stamp-rust', bg: 'bg-stamp-rust/10' },
  { icon: 'text-teal-400', bg: 'bg-teal-400/10' },
  { icon: 'text-pink-400', bg: 'bg-pink-400/10' },
]

export default function Home() {
  const { t } = useLanguage()
  const stats = t('home.stats')
  const steps = t('home.steps')
  const features = t('home.features')

  return (
    <div className="text-paper">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
{/*           <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-6"> */}
{/*             <Sparkles size={13} className="text-stamp-green" /> */}
{/*             <span className="text-paper/70 text-xs">{t('home.badge')}</span> */}
{/*           </div> */}

          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] max-w-xl">
            {t('home.title1')} <span className="text-stamp-amber">{t('home.title2')}</span>
          </h1>
          <p className="mt-5 text-paper/70 max-w-xl text-base sm:text-lg">{t('home.body')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/log"
              className="focus-ring inline-flex items-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-3 text-sm hover:brightness-110 transition"
            >
              {t('home.ctaLog')} <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="focus-ring inline-flex items-center gap-2 border border-white/20 text-paper rounded-full px-5 py-3 text-sm hover:bg-white/5 transition"
            >
              <Play size={14} /> {t('home.ctaDashboard')}
            </Link>
          </div>
        </div>

        <IndiaGlowGraphic />
      </section>

      {/* Problem stats */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:divide-x sm:divide-white/10">
          {stats.map(([n, label], i) => {
            const Icon = STAT_ICONS[i]
            return (
              <div key={label} className={`flex items-center gap-3 ${i > 0 ? 'sm:pl-6' : ''}`}>
                <div className={`w-11 h-11 rounded-full bg-white/[0.04] ${STAT_COLORS[i]} flex items-center justify-center shrink-0`}>
                  <Icon size={19} />
                </div>
                <div>
                  <div className="font-display text-2xl text-paper leading-none">{n}</div>
                  <div className="text-paper/55 text-xs mt-1.5">{label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pb-20">
        <div className="text-center mb-3">
          <span className="text-stamp-amber text-xs sm:text-sm font-semibold tracking-wide">{t('home.tag')}</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl mb-10 text-center">{t('home.featuresTitle')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[i]
            const colors = FEATURE_COLORS[i] || FEATURE_COLORS[0]
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.icon} flex items-center justify-center mb-4`}>
                  <Icon size={18} />
                </div>
                <div className="font-semibold text-paper">{f.title}</div>
                <div className="text-paper/55 text-sm mt-1.5 leading-relaxed">{f.body}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 py-8 pb-20">
        <h2 className="font-display text-2xl mb-8">{t('home.howTitle')}</h2>
        <div className="ledger-page rounded-2xl shadow-ledger overflow-hidden text-ink">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <div
                key={step.title}
                className={`flex gap-5 px-6 py-6 ${i !== steps.length - 1 ? 'border-b border-maroon/15' : ''}`}
              >
                <div className="font-mono text-maroon/50 text-sm pt-1">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-10 h-10 rounded-full bg-maroon/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-maroon" />
                </div>
                <div>
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-ink/65 text-sm mt-1 max-w-md">{step.body}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bottom promo banner */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pb-24">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-maroon-light/10 via-white/[0.03] to-transparent px-7 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-white/[0.05] text-stamp-amber flex items-center justify-center shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <div className="font-display text-lg sm:text-xl text-stamp-amber">{t('home.bottomTitle')}</div>
              <p className="text-paper/60 text-sm mt-1">{t('home.bottomBody')}</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="focus-ring inline-flex items-center gap-2 bg-stamp-amber text-ink font-semibold rounded-full px-5 py-3 text-sm hover:brightness-110 transition shrink-0"
          >
            {t('home.bottomCta')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
