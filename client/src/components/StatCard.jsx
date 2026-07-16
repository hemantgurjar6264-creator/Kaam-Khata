export default function StatCard({ label, value, accent = 'text-paper' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <div className={`font-display text-2xl ${accent}`}>{value}</div>
      <div className="text-paper/55 text-xs mt-0.5">{label}</div>
    </div>
  )
}
