import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Crown, Trophy, TrendingUp, Calendar, ChevronRight, Settings, Check, X } from 'lucide-react'
import { progressAPI } from '../api/client'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ease = [0.16, 1, 0.3, 1]
const up = (d = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease } })

const MILESTONE_LEVELS = [
  { days: 7,  label: 'Starter',    color: 'var(--lime)',       bg: 'var(--sage-light)' },
  { days: 14, label: 'Consistent', color: 'var(--amber)',        bg: 'var(--gold-light)' },
  { days: 30, label: 'Disciplined',color: 'var(--amber)', bg: 'var(--terra-light)' },
  { days: 60, label: 'Dedicated',  color: '#7C3AED',            bg: '#F0EAF8' },
  { days: 90, label: 'Elite',      color: 'var(--lime)',     bg: 'var(--sage-light)' },
]

function getMilestone(n) { return [...MILESTONE_LEVELS].reverse().find(m => n >= m.days) || null }
function getNextMilestone(n) { return MILESTONE_LEVELS.find(m => n < m.days) || null }

function FlameIcon({ streak }) {
  const sz = Math.min(28 + Math.sqrt(streak) * 5, 60)
  return (
    <motion.span
      animate={{ scale: [1, 1.1, 1], rotate: [-3, 3, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ fontSize: sz, lineHeight: 1, display: 'inline-block' }}>
      🔥
    </motion.span>
  )
}

function ScoreRing({ score }) {
  const sz = 110, r = (sz - 10) / 2, circ = 2 * Math.PI * r
  const color = score >= 80 ? 'var(--fern)' : score >= 60 ? 'var(--gold)' : score >= 40 ? 'var(--terracotta)' : 'var(--stone)'
  return (
    <div style={{ position: 'relative', width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--linen)" strokeWidth={7} />
        <motion.circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round"
          initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 1.4, delay: 0.4, ease: 'easeOut' }}
          style={{ strokeDasharray: circ }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 400, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {score}
        </motion.span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 2 }}>score</span>
      </div>
    </div>
  )
}

function Bar({ label, value, max, color, unit = '', icon = '' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{icon} {label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
          {value}{unit} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {max}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 100, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 100 }} />
      </div>
    </div>
  )
}

function WeeklyChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.calories), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 90 }}>
      {data.map((w, i) => {
        const h = Math.max((w.calories / max) * 78, 3)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
              title={`${w.calories} kcal`}
              style={{ width: '100%', background: 'var(--fern)', borderRadius: '5px 5px 3px 3px', opacity: 0.6 + i * 0.07 }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{w.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function CalHeatmap({ data }) {
  const STATUS = { green: 'var(--fern)', yellow: 'var(--gold)', empty: 'var(--linen)' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
      {['M','T','W','T','F','S','S'].map((d, i) => (
        <div key={i} style={{ textAlign: 'center', fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: 2 }}>{d}</div>
      ))}
      {data?.map((day, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.007, duration: 0.18 }}
          title={`${day.date} — ${day.items || 0} items`}
          style={{ aspectRatio: '1', borderRadius: 4, background: STATUS[day.status], opacity: day.status === 'empty' ? 0.5 : 0.85 }} />
      ))}
    </div>
  )
}

function AchievementBadge({ a }) {
  return (
    <motion.div whileHover={a.unlocked ? { y: -2 } : {}}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '0.75rem 0.375rem', borderRadius: 14, textAlign: 'center',
        background: a.unlocked ? 'white' : 'var(--cream)', border: `1px solid ${a.unlocked ? 'var(--linen-mid)' : 'var(--linen)'}`,
        opacity: a.unlocked ? 1 : 0.4, filter: a.unlocked ? 'none' : 'grayscale(1)', transition: 'all 0.18s' }}>
      <span style={{ fontSize: '1.375rem', lineHeight: 1 }}>{a.icon}</span>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: a.unlocked ? 'var(--espresso)' : 'var(--stone)', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>{a.name}</span>
      {a.unlocked && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--fern)' }} />}
    </motion.div>
  )
}

// ── Daily Checklist Component ─────────────────────────────────────────────────
function DailyChecklist({ checklist, onSubmit, loading }) {
  const [selected, setSelected] = useState(checklist?.today_completed || [])
  const [submitted, setSubmitted] = useState(checklist?.checked_in_today || false)

  useEffect(() => {
    setSelected(checklist?.today_completed || [])
    setSubmitted(checklist?.checked_in_today || false)
  }, [checklist])

  const activeItems = checklist?.items?.filter(i => i.active) || []
  const needed = 4
  const count = selected.length

  const toggle = (key) => {
    if (submitted) return
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
  }

  const handleSubmit = async () => {
    if (count < 1) { toast.error('Check at least one item to log your day.'); return }
    await onSubmit(selected)
    setSubmitted(true)
  }

  const pct = Math.min((count / needed) * 100, 100)
  const isConsistent = count >= needed

  return (
    <div>
      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          {submitted
            ? checklist?.today_is_consistent ? '✅ Consistent day logged!' : `${count} items logged`
            : `${count} / ${needed} needed for a consistent day`}
        </div>
        {!submitted && (
          <div style={{ fontSize: '0.72rem', color: isConsistent ? 'var(--fern)' : 'var(--stone)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
            {isConsistent ? '🔥 Ready!' : `${needed - count} more`}
          </div>
        )}
      </div>

      {/* Mini progress bar */}
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 100, overflow: 'hidden', marginBottom: '1rem' }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }}
          style={{ height: '100%', background: isConsistent ? 'var(--lime)' : 'var(--amber)', borderRadius: 100 }} />
      </div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {activeItems.map((item) => {
          const done = selected.includes(item.key)
          return (
            <motion.button key={item.key} onClick={() => toggle(item.key)}
              whileHover={!submitted ? { x: 2 } : {}}
              whileTap={!submitted ? { scale: 0.98 } : {}}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 0.875rem', borderRadius: 14,
                background: done ? 'var(--lime-glow)' : 'var(--surface2)',
                border: `1.5px solid ${done ? 'rgba(61,122,88,0.3)' : 'var(--linen-mid)'}`,
                cursor: submitted ? 'default' : 'pointer',
                transition: 'all 0.18s', textAlign: 'left', width: '100%',
              }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--lime)' : 'var(--surface)', border: `1.5px solid ${done ? 'var(--lime)' : 'var(--border2)'}`, transition: 'all 0.18s' }}>
                {done
                  ? <Check size={14} color="var(--night)" strokeWidth={3} />
                  : <span style={{ fontSize: '0.875rem' }}>{item.icon}</span>}
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: done ? 600 : 400,
                color: done ? 'var(--forest)' : 'var(--warm-gray)', flex: 1 }}>
                {item.label}
              </span>
              {done && !submitted && (
                <span style={{ fontSize: '0.68rem', color: 'var(--lime)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>✓</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {!submitted && (
        <motion.button onClick={handleSubmit} disabled={loading || count === 0}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: isConsistent ? 'var(--lime)' : 'var(--surface3)', color: isConsistent ? 'var(--night)' : 'var(--text-muted)' }}>
          {loading
            ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            : <><Check size={15} /> Log Today{isConsistent ? ' 🔥' : ''}</>}
        </motion.button>
      )}
    </div>
  )
}

// ── Checklist Settings Modal ──────────────────────────────────────────────────
function ChecklistSettingsModal({ items, onSave, onClose }) {
  const [active, setActive] = useState(items.filter(i => i.active).map(i => i.key))

  const toggle = (key) => {
    setActive(s => s.includes(key)
      ? s.length > 2 ? s.filter(k => k !== key) : s  // minimum 2
      : [...s, key])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,58,43,0.45)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease }} onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', borderRadius: 24, padding: '1.75rem', width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Customise Checklist
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="var(--warm-gray)" />
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Choose which habits to track. You need at least 4 active items to earn a consistent day.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {items.map(item => {
            const on = active.includes(item.key)
            return (
              <button key={item.key} onClick={() => toggle(item.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: 12, border: `1.5px solid ${on ? 'var(--lime)' : 'var(--border2)'}`,
                  background: on ? 'var(--lime-glow)' : 'var(--surface2)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: on ? 600 : 400, color: on ? 'var(--forest)' : 'var(--warm-gray)', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: on ? 'var(--fern)' : 'white', border: `1.5px solid ${on ? 'var(--lime)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {on && <Check size={11} color="white" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={() => onSave(active)} className="btn btn-primary" style={{ flex: 1 }}>Save Preferences</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const navigate = useNavigate()
  const { subscriptionTier } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [freezeLoading, setFreezeLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const isPremium = subscriptionTier === 'premium'

  const fetchProgress = useCallback(async () => {
    try {
      const res = await progressAPI.get()
      setData(res.data)
    } catch {
      toast.error('Failed to load progress.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  const handleCheckin = async (completedItems) => {
    setCheckinLoading(true)
    try {
      const res = await progressAPI.checkin(completedItems)
      if (res.data.newly_unlocked?.length) {
        res.data.newly_unlocked.forEach(a => toast.success(`🏆 ${a.name} unlocked!`))
      }
      if (res.data.is_new_consistent_day) {
        toast.success(`🔥 Consistent day! Streak: ${res.data.streak.current} days`)
      } else if (completedItems.length > 0) {
        toast.success(`Logged ${completedItems.length} items today`)
      }
      fetchProgress()
    } catch {
      toast.error('Failed to log check-in.')
    } finally { setCheckinLoading(false) }
  }

  const handleSavePrefs = async (items) => {
    try {
      await progressAPI.saveChecklistPrefs(items)
      toast.success('Checklist preferences saved!')
      setShowSettings(false)
      fetchProgress()
    } catch { toast.error('Failed to save preferences.') }
  }

  const handleFreeze = async () => {
    if (!isPremium) { navigate('/upgrade'); return }
    setFreezeLoading(true)
    try {
      await progressAPI.useFreeze()
      toast.success('Streak freeze used! Your streak is protected.')
      fetchProgress()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to use freeze.')
    } finally { setFreezeLoading(false) }
  }

  const streak = data?.streak
  const milestone = streak ? getMilestone(streak.current) : null
  const nextMil = streak ? getNextMilestone(streak.current) : null
  const nextPct = nextMil ? Math.min((streak.current / nextMil.days) * 100, 100) : 100
  const snap = data?.today_snapshot

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <motion.div {...up(0)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            Your Progress
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
            Log your daily habits. Build your streak. Every day counts.
          </p>
        </div>
        <Link to="/generate" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={15} /> New Plan
        </Link>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[200, 140, 160, 130].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, borderRadius: 22 }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── Daily Checklist + Streak side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: '1rem' }}>

            {/* Daily checklist */}
            <motion.div {...up(0.05)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
                    Daily Check-in
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '0.1rem' }}>
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
                <button onClick={() => setShowSettings(true)}
                  style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--sage-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--cream)'}>
                  <Settings size={13} color="var(--warm-gray)" />
                </button>
              </div>
              <DailyChecklist checklist={data?.checklist} onSubmit={handleCheckin} loading={checkinLoading} />
            </motion.div>

            {/* Streak */}
            <motion.div {...up(0.08)} style={{
              background: 'linear-gradient(160deg, var(--forest) 0%, var(--forest-mid) 70%, #3D7A58 100%)',
              borderRadius: 22, padding: '1.5rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(196,82,26,0.1)' }} />

              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-body)', marginBottom: '0.75rem' }}>
                Health Streak
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', position: 'relative' }}>
                <FlameIcon streak={streak?.current || 0} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 400, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {streak?.current || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}>
                    day{streak?.current !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {milestone && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-body)', width: 'fit-content', marginBottom: '0.875rem' }}>
                  🔥 {milestone.label}
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)', marginBottom: 'auto' }}>
                Best: <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{streak?.longest || 0}d</strong>
                {' · '}Total: <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{streak?.total_active_days || 0}d</strong>
              </div>

              {/* Next milestone */}
              {nextMil && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{nextMil.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>{nextMil.days - streak.current}d to go</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${nextPct}%` }} transition={{ duration: 1.2, delay: 0.5 }}
                      style={{ height: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 100 }} />
                  </div>
                </div>
              )}

              {/* Freeze */}
              <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {isPremium ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
                      🛡️ Freezes: <strong style={{ color: (streak?.freeze_tokens || 0) > 0 ? '#F5D47A' : 'rgba(255,255,255,0.3)' }}>{streak?.freeze_tokens || 0}</strong>
                    </span>
                    {(streak?.freeze_tokens || 0) > 0 && (
                      <button onClick={handleFreeze} disabled={freezeLoading}
                        style={{ padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#F5D47A', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        Use
                      </button>
                    )}
                  </div>
                ) : (
                  <Link to="/upgrade" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
                    🛡️ <span style={{ color: '#F4B48A', fontWeight: 600 }}>Upgrade</span> for streak freeze
                  </Link>
                )}
              </div>

              {/* Comeback mode */}
              {streak?.current === 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem', background: 'rgba(196,82,26,0.2)', border: '1px solid rgba(196,82,26,0.3)', borderRadius: 12 }}>
                  <span style={{ fontSize: '0.78rem', color: '#F4B48A', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    💪 Let's rebuild — complete today's checklist!
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Health Score + Nutrition Snapshot ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '1rem' }}>
            <motion.div {...up(0.12)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.875rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>Health Score</div>
              <ScoreRing score={data?.health_score || 0} />
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.5, maxWidth: 130 }}>
                {(data?.health_score || 0) >= 80 ? 'Outstanding! You\'re crushing it.' :
                 (data?.health_score || 0) >= 60 ? 'Good progress — keep logging.' :
                 (data?.health_score || 0) >= 40 ? 'Getting there. Log daily habits.' :
                 'Start your daily check-ins to build your score.'}
              </div>
            </motion.div>

            <motion.div {...up(0.14)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>Latest Plan Nutrition</div>
                {snap && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{snap.meal_count} meals</span>}
              </div>
              {snap ? (
                <>
                  <Bar label="Calories" value={snap.calories} max={snap.calorie_target} color="var(--terracotta)" unit=" kcal" icon="🔥" />
                  <Bar label="Protein"  value={snap.protein}  max={Math.round(snap.calorie_target * 0.03)}  color="var(--fern)"  unit="g" icon="💪" />
                  <Bar label="Carbs"    value={snap.carbs}    max={Math.round(snap.calorie_target * 0.075)} color="var(--gold)"  unit="g" icon="🌾" />
                  <Bar label="Fats"     value={snap.fats}     max={Math.round(snap.calorie_target * 0.025)} color="#8B5CF6"      unit="g" icon="🫙" />
                </>
              ) : (
                <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Generate a plan to see your nutrition snapshot.</div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Stats + Weekly Chart ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '1rem' }}>
            <motion.div {...up(0.17)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)', marginBottom: '1rem' }}>All-Time</div>
              {[
                { label: 'Plans generated',   value: data?.stats?.total_plans || 0,           icon: '🍽️' },
                { label: 'Consistent days',   value: data?.stats?.total_consistent_days || 0, icon: '🔥' },
                { label: 'Meals rated',       value: data?.stats?.total_rated || 0,           icon: '⭐' },
                { label: 'Avg rating',        value: data?.stats?.avg_rating ? `${data.stats.avg_rating}/5` : '—', icon: '🏅' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{icon} {label}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.02em' }}>{value}</span>
                </div>
              ))}
            </motion.div>

            <motion.div {...up(0.19)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)', marginBottom: '1rem' }}>
                Calorie Trend — Last 6 Weeks
              </div>
              <WeeklyChart data={data?.weekly_nutrition} />
            </motion.div>
          </div>

          {/* ── AI Insights ── */}
          {data?.insights?.length > 0 && (
            <motion.div {...up(0.21)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={14} color="var(--fern)" />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>Smart Insights</div>
                {!isPremium && (
                  <Link to="/upgrade" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
                    <Crown size={11} /> Premium
                  </Link>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {data.insights.map((ins, i) => {
                  const TYPE = {
                    positive: { bg: 'var(--sage-light)', border: 'rgba(61,122,88,0.2)', text: 'var(--forest)' },
                    warning:  { bg: 'var(--gold-light)',  border: 'rgba(192,125,26,0.2)', text: '#7A5B1A' },
                    info:     { bg: 'var(--cream)',       border: 'var(--linen-mid)',     text: 'var(--warm-gray)' },
                  }
                  const s = TYPE[ins.type] || TYPE.info
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ins.icon}</span>
                      <p style={{ fontSize: '0.85rem', color: s.text, lineHeight: 1.55, fontFamily: 'var(--font-body)', margin: 0 }}>{ins.text}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Achievements ── */}
          <motion.div {...up(0.23)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={14} color="var(--gold)" />
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>Achievements</div>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {data?.achievements?.filter(a => a.unlocked).length || 0} / {data?.achievements?.length || 0}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
              {data?.achievements?.map(a => <AchievementBadge key={a.slug} a={a} />)}
            </div>
          </motion.div>

          {/* ── Calendar ── */}
          <motion.div {...up(0.26)} style={{ background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--lime-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} color="var(--fern)" />
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
                  Activity — Last 35 Days
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.875rem' }}>
                {[['var(--fern)', '4+ items'], ['var(--gold)', '1-3 items'], ['var(--linen)', 'No check-in']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: c }} /> {l}
                  </div>
                ))}
              </div>
            </div>
            <CalHeatmap data={data?.calendar} />
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div {...up(0.29)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Generate Plan',  icon: '🍽️', to: '/generate', primary: true },
              { label: 'View History',   icon: '📋', to: '/history',  primary: false },
              { label: 'My Profile',     icon: '⚙️', to: '/profile',  primary: false },
              { label: isPremium ? 'Subscription' : 'Upgrade', icon: '✦', to: '/upgrade', accent: !isPremium },
            ].map(({ label, icon, to, primary, accent }) => (
              <Link key={label} to={to}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: 16, textDecoration: 'none',
                  background: primary ? 'var(--lime)' : accent ? 'var(--amber)' : 'var(--surface2)',
                  border: `1px solid ${primary || accent ? 'transparent' : 'var(--border2)'}`,
                  color: primary ? 'var(--night)' : accent ? 'var(--night)' : 'var(--text-dim)',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <span style={{ fontSize: '1.125rem' }}>{icon}</span>
                {label}
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </Link>
            ))}
          </motion.div>
        </>
      )}

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && data?.checklist?.items && (
          <ChecklistSettingsModal items={data.checklist.items} onSave={handleSavePrefs} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}