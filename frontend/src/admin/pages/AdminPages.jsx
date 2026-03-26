// ── Admin Plans Page ──────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { adminAPI } from '../adminApi'
import { Card, CardHeader, SectionHeader, SearchBar, Badge, ActionBtn, ConfirmModal, LoadingSpinner, TableRow, formatDate, AMBER, TEXT, TEXT_DIM, TEXT_MUTED, SURFACE2, td, th } from '../components/AdminComponents'
import toast from 'react-hot-toast'
import { FileText, Cpu, CreditCard, Bell, Trophy, Settings, Play, Plus, Send } from 'lucide-react'
import { motion } from 'framer-motion'

export function AdminPlans() {
  const [plans, setPlans] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.plans({ q, page })
      setPlans(res.data.plans); setTotal(res.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [q, page]) // eslint-disable-line

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await adminAPI.deletePlan(id)
      toast.success('Plan deleted.')
      fetch()
    } catch { toast.error('Failed to delete plan.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeader title={`Plans (${total})`} />
      <SearchBar value={q} onChange={v => { setQ(v); setPage(1) }} placeholder="Search by title, user..." />
      <Card>
        {loading ? <LoadingSpinner /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Plan', 'User', 'Type', 'Meals', 'Saved', 'Created', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <td style={td}><div style={{ fontWeight: 600, color: TEXT }}>{p.title}</div><div style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>ID: {p.id}</div></td>
                    <td style={td}><div style={{ color: TEXT_DIM }}>{p.user.username}</div><div style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>{p.user.email}</div></td>
                    <td style={td}><Badge color={p.is_partial ? '#F87171' : '#34D399'}>{p.is_partial ? '3-Day' : '7-Day'}</Badge></td>
                    <td style={{ ...td, textAlign: 'center' }}>{p.meal_count}</td>
                    <td style={td}>{p.is_saved ? <Badge color={AMBER}>Saved</Badge> : <span style={{ color: TEXT_MUTED, fontSize: '0.78rem' }}>—</span>}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                    <td style={td}><ActionBtn small color="#F87171" onClick={() => handleDelete(p.id, p.title)}>Delete</ActionBtn></td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {total > 20 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <ActionBtn small onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</ActionBtn>
          <span style={{ fontSize: '0.82rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <ActionBtn small onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>Next →</ActionBtn>
        </div>
      )}
    </div>
  )
}


// ── AI Monitor ────────────────────────────────────────────────────────────────
export function AdminAI() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.aiMonitor().then(r => setData(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <LoadingSpinner />

  const { generation: g, meal_quality: mq, region_stats, goal_stats } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeader title="AI Monitor" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Total Plans', value: g.total_plans },
          { label: 'This Week', value: g.plans_this_week },
          { label: 'Full Plans', value: g.full_plans },
          { label: 'Partial Plans', value: g.partial_plans },
          { label: 'Meals Rated', value: mq.rated_meals },
          { label: 'Avg Rating', value: mq.avg_rating ? `${mq.avg_rating}/5` : '—' },
          { label: 'Rating Rate', value: `${mq.rating_rate}%` },
          { label: 'Avg Meals/Plan', value: g.avg_meals_per_plan },
        ].map(({ label, value }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            style={{ background: '#162019', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)', marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: AMBER }}>{value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card>
          <CardHeader><Cpu size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Plans by Region</span></CardHeader>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {region_stats.map(r => (
              <div key={r.region} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: TEXT_DIM, fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{(r.region || 'Unknown').replace(/_/g, ' ')}</span>
                <Badge color={AMBER}>{r.plan_count}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader><Cpu size={13} color="#A78BFA" /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Fitness Goals</span></CardHeader>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {goal_stats.map(g => (
              <div key={g.fitness_goal} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: TEXT_DIM, fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>{(g.fitness_goal || '—').replace(/_/g, ' ')}</span>
                <Badge color="#A78BFA">{g.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}


// ── Payments ──────────────────────────────────────────────────────────────────
export function AdminPayments() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.payments().then(r => setData(r.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title={`Premium Users (${data.count})`} />
        <div style={{ background: '#162019', border: `1px solid ${AMBER}30`, borderRadius: 12, padding: '0.625rem 1rem' }}>
          <span style={{ fontSize: '0.72rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>Est. Monthly Revenue</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: AMBER }}>GHS {data.monthly_revenue_estimate}</div>
        </div>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['User', 'Email', 'Paystack ID', 'Joined', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.premium_users.map(u => (
                <TableRow key={u.user_id}>
                  <td style={td}><div style={{ fontWeight: 600, color: TEXT }}>{u.name || u.username}</div><div style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>@{u.username}</div></td>
                  <td style={td}>{u.email}</td>
                  <td style={{ ...td, fontSize: '0.72rem', fontFamily: 'monospace', color: TEXT_MUTED }}>{u.paystack_customer_id || '—'}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(u.date_joined)}</td>
                  <td style={td}><Badge color={u.is_active ? '#34D399' : '#F87171'}>{u.is_active ? 'Active' : 'Suspended'}</Badge></td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}


// ── Notifications ─────────────────────────────────────────────────────────────
export function AdminNotifications() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'all', type: 'general' })
  const [sending, setSending] = useState(false)

  useEffect(() => { adminAPI.notifications().then(r => setData(r.data)).finally(() => setLoading(false)) }, [])

  const handleBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) { toast.error('Title and message required.'); return }
    setSending(true)
    try {
      const res = await adminAPI.broadcast(broadcast)
      toast.success(res.data.message)
      setBroadcast({ title: '', message: '', target: 'all', type: 'general' })
    } catch { toast.error('Failed to send.') }
    finally { setSending(false) }
  }

  const inputStyle = { width: '100%', padding: '0.625rem 0.875rem', background: SURFACE2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: TEXT, fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Broadcast form */}
      <Card>
        <CardHeader><Send size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Broadcast Notification</span></CardHeader>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem', fontFamily: 'var(--font-body)' }}>Target Audience</label>
              <select value={broadcast.target} onChange={e => setBroadcast(b => ({ ...b, target: e.target.value }))} style={inputStyle}>
                <option value="all">All Users</option>
                <option value="premium">Premium Only</option>
                <option value="free">Free Only</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem', fontFamily: 'var(--font-body)' }}>Type</label>
              <select value={broadcast.type} onChange={e => setBroadcast(b => ({ ...b, type: e.target.value }))} style={inputStyle}>
                <option value="general">General</option>
                <option value="upgrade">Upgrade</option>
                <option value="weekly_summary">Weekly Summary</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem', fontFamily: 'var(--font-body)' }}>Title</label>
            <input value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} placeholder="Notification title" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem', fontFamily: 'var(--font-body)' }}>Message</label>
            <textarea value={broadcast.message} onChange={e => setBroadcast(b => ({ ...b, message: e.target.value }))} placeholder="Notification message" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <ActionBtn onClick={handleBroadcast} disabled={sending} color={AMBER}>
            <Send size={13} /> {sending ? 'Sending...' : 'Send to All'}
          </ActionBtn>
        </div>
      </Card>

      {/* Recent notifications */}
      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardHeader><Bell size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Recent Notifications ({data.total})</span><Badge color={AMBER}>{data.unread} unread</Badge></CardHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['User', 'Title', 'Type', 'Read', 'Sent'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {data.notifications.map(n => (
                  <TableRow key={n.id}>
                    <td style={td}>{n.user}</td>
                    <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</td>
                    <td style={td}><Badge color={TEXT_MUTED}>{n.type}</Badge></td>
                    <td style={td}>{n.is_read ? '✓' : <span style={{ color: AMBER }}>●</span>}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatDate(n.created_at)}</td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}


// ── Achievements ──────────────────────────────────────────────────────────────
export function AdminAchievements() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ slug: '', name: '', description: '', icon: '🏆' })
  const [creating, setCreating] = useState(false)

  const fetch = () => { adminAPI.achievements().then(r => setData(r.data)).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [])

  const handleCreate = async () => {
    if (!form.slug || !form.name) { toast.error('Slug and name required.'); return }
    setCreating(true)
    try {
      const res = await adminAPI.createAchievement(form)
      toast.success(res.data.message)
      setForm({ slug: '', name: '', description: '', icon: '🏆' })
      fetch()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create.') }
    finally { setCreating(false) }
  }

  const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', background: SURFACE2, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: TEXT, fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SectionHeader title={`Achievements (${data?.achievements?.length || 0})`} />
          {loading ? <LoadingSpinner /> : (
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Icon', 'Name', 'Slug', 'Description', 'Unlocks'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.achievements.map(a => (
                      <TableRow key={a.id}>
                        <td style={{ ...td, fontSize: '1.25rem', textAlign: 'center' }}>{a.icon}</td>
                        <td style={{ ...td, fontWeight: 600, color: TEXT, whiteSpace: 'nowrap' }}>{a.name}</td>
                        <td style={{ ...td, fontSize: '0.72rem', fontFamily: 'monospace', color: TEXT_MUTED }}>{a.slug}</td>
                        <td style={{ ...td, maxWidth: 200, color: TEXT_MUTED, fontSize: '0.78rem' }}>{a.description}</td>
                        <td style={{ ...td, textAlign: 'center' }}><Badge color={AMBER}>{a.unlock_count}</Badge></td>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader><Plus size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Create Achievement</span></CardHeader>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['slug', 'Slug (e.g. first_bite)'], ['name', 'Name'], ['description', 'Description'], ['icon', 'Icon (emoji)']].map(([key, label]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem', fontFamily: 'var(--font-body)' }}>{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <ActionBtn onClick={handleCreate} disabled={creating} color={AMBER}><Plus size={13} />{creating ? 'Creating...' : 'Create'}</ActionBtn>
          </div>
        </Card>
      </div>

      {/* Recent unlocks */}
      {data?.recent_unlocks?.length > 0 && (
        <Card>
          <CardHeader><Trophy size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Recent Unlocks</span></CardHeader>
          <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {data.recent_unlocks.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '1rem' }}>{u.icon}</span>
                <span style={{ fontSize: '0.82rem', color: TEXT_DIM, fontFamily: 'var(--font-body)', flex: 1 }}><b style={{ color: TEXT }}>{u.user}</b> unlocked <b style={{ color: AMBER }}>{u.achievement}</b></span>
                <span style={{ fontSize: '0.72rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{formatDate(u.unlocked_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}


// ── System Controls ───────────────────────────────────────────────────────────
export function AdminSystem() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(null)
  const [output, setOutput] = useState({})

  useEffect(() => { adminAPI.system().then(r => setData(r.data)).finally(() => setLoading(false)) }, [])

  const handleRun = async (command) => {
    if (!window.confirm(`Run "${command}"?`)) return
    setRunning(command)
    try {
      const res = await adminAPI.runCommand(command)
      toast.success(res.data.message)
      setOutput(o => ({ ...o, [command]: res.data.output || 'Completed successfully.' }))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Command failed.')
      setOutput(o => ({ ...o, [command]: err.response?.data?.error || 'Command failed.' }))
    }
    finally { setRunning(null) }
  }

  if (loading) return <LoadingSpinner />

  const h = data.health

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Health */}
      <Card>
        <CardHeader><Settings size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>System Health</span><Badge color="#34D399">{h.status.toUpperCase()}</Badge></CardHeader>
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Django', value: h.django_version },
            { label: 'Python', value: h.python_version },
            { label: 'Users', value: h.total_users },
            { label: 'Plans', value: h.total_plans },
            { label: 'Notifications', value: h.total_notifications },
            { label: 'Premium', value: h.total_premium },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: SURFACE2, borderRadius: 10, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: AMBER }}>{value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Management commands */}
      <Card>
        <CardHeader><Play size={13} color={AMBER} /><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Management Commands</span></CardHeader>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {data.scheduled_commands.map(cmd => (
            <div key={cmd.name} style={{ background: SURFACE2, borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: TEXT, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{cmd.name}</div>
                <div style={{ fontSize: '0.78rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>{cmd.description}</div>
                <div style={{ fontSize: '0.68rem', color: AMBER, fontFamily: 'var(--font-body)', marginTop: '0.2rem' }}>Scheduled: {cmd.schedule}</div>
                {output[cmd.name] && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#34D399', fontFamily: 'monospace', background: 'rgba(52,211,153,0.08)', padding: '0.375rem 0.625rem', borderRadius: 6 }}>
                    {output[cmd.name]}
                  </div>
                )}
              </div>
              <ActionBtn onClick={() => handleRun(cmd.name)} disabled={running === cmd.name} color={AMBER}>
                <Play size={12} /> {running === cmd.name ? 'Running...' : 'Run Now'}
              </ActionBtn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}