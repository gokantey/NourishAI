// ── Design tokens ─────────────────────────────────────────────────────────────
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

// ── Table style objects ────────────────────────────────────────────────────────
export const td = {
  padding: '0.75rem 1rem',
  fontSize: '0.82rem',
  color: TEXT_DIM,
  fontFamily: 'var(--font-body)',
  verticalAlign: 'middle',
}

export const th = {
  padding: '0.625rem 1rem',
  fontSize: '0.65rem',
  fontWeight: 700,
  color: TEXT_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  fontFamily: 'var(--font-body)',
  textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`,
  background: SURFACE2,
}

// ── Utility functions ─────────────────────────────────────────────────────────
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}