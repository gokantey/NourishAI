import { motion } from 'framer-motion'

export const AMBER = '#F5A623'
export const AMBER_DIM = '#D4841A'
export const AMBER_GLOW = 'rgba(245,166,35,0.12)'
export const SURFACE = '#162019'
export const SURFACE2 = '#1C2B22'
export const BORDER = 'rgba(255,255,255,0.07)'
export const BORDER2 = 'rgba(255,255,255,0.12)'
export const TEXT = '#F0F5F0'
export const TEXT_DIM = 'rgba(240,245,240,0.6)'
export const TEXT_MUTED = 'rgba(240,245,240,0.35)'

export function StatCard({ label, value, sub, color, icon: Icon, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
      style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.125rem', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color || AMBER; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = '' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>{label}</div>
        {Icon && <div style={{ width: 28, height: 28, borderRadius: 8, background: (color || AMBER) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color || AMBER} />
        </div>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, color: TEXT, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>{sub}</div>}
    </motion.div>
  )
}

export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: TEXT, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      {action}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden', ...style }}>
      {children}
    </div>
  )
}

export function CardHeader({ children }) {
  return (
    <div style={{ padding: '0.875rem 1.125rem', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {children}
    </div>
  )
}

export function Badge({ children, color = AMBER }) {
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 100, background: color + '20', border: `1px solid ${color}40`, color, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
      {children}
    </span>
  )
}

export function MiniBar({ value, max, color = AMBER }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', marginTop: 4 }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 100 }} />
    </div>
  )
}

export function SparkLine({ data = [], color = AMBER, height = 40 }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 200; const h = height
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (d.count / max) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  )
}

export function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)', gap: '0.75rem' }}>
      <span style={{ width: 18, height: 18, border: `2px solid ${BORDER2}`, borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      Loading...
    </div>
  )
}

export function TableRow({ children, onClick, hover = true }) {
  return (
    <tr onClick={onClick}
      style={{ borderBottom: `1px solid ${BORDER}`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
      onMouseEnter={e => { if (hover) e.currentTarget.style.background = SURFACE2 }}
      onMouseLeave={e => { if (hover) e.currentTarget.style.background = 'transparent' }}>
      {children}
    </tr>
  )
}

export const td = { padding: '0.75rem 1rem', fontSize: '0.82rem', color: TEXT_DIM, fontFamily: 'var(--font-body)', verticalAlign: 'middle' }
export const th = { padding: '0.625rem 1rem', fontSize: '0.65rem', fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding: '0.5rem 0.875rem', background: SURFACE2, border: `1px solid ${BORDER2}`, borderRadius: 10, color: TEXT, fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none', width: '100%', maxWidth: 280 }}
      onFocus={e => { e.target.style.borderColor = AMBER; e.target.style.boxShadow = `0 0 0 3px ${AMBER_GLOW}` }}
      onBlur={e => { e.target.style.borderColor = BORDER2; e.target.style.boxShadow = 'none' }} />
  )
}

export function ActionBtn({ onClick, children, color = AMBER, disabled = false, small = false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: small ? '4px 10px' : '6px 14px', borderRadius: 100, background: color + '18', border: `1px solid ${color}35`, color, fontSize: small ? '0.72rem' : '0.78rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = color + '30' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = color + '18' }}>
      {children}
    </button>
  )
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#162019', border: `1px solid ${danger ? 'rgba(248,113,113,0.3)' : BORDER2}`, borderRadius: 18, padding: '1.5rem', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: TEXT, marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ fontSize: '0.875rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{message}</div>
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
          <ActionBtn onClick={onCancel} color={TEXT_MUTED}>Cancel</ActionBtn>
          <ActionBtn onClick={onConfirm} color={danger ? '#F87171' : AMBER}>{danger ? 'Confirm' : 'Confirm'}</ActionBtn>
        </div>
      </div>
    </div>
  )
}