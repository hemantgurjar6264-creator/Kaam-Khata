const TONES = {
  amber: { bg: 'bg-stamp-amber/15', text: 'text-stamp-amber' },
  green: { bg: 'bg-stamp-green/15', text: 'text-stamp-green' },
  rust: { bg: 'bg-stamp-rust/15', text: 'text-stamp-rust' },
  maroon: { bg: 'bg-maroon/20', text: 'text-maroon-light' },
}

export default function IconStatCard({ icon: Icon, label, value, tone = 'amber' }) {
  const t = TONES[tone] || TONES.amber
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className={`w-9 h-9 rounded-xl ${t.bg} ${t.text} flex items-center justify-center mb-3`}>
        <Icon size={17} />
      </div>
      <div className="font-display text-2xl text-paper">{value}</div>
      <div className="text-paper/50 text-xs mt-0.5">{label}</div>
    </div>
  )
}
