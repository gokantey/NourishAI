import { useEffect, useState } from 'react'
import { Users, FileText, Crown, TrendingUp, DollarSign, Bookmark, UserPlus, BarChart2 } from 'lucide-react'
import { adminAPI } from '../adminApi'
import { StatCard, Card, CardHeader, SectionHeader, SparkLine, LoadingSpinner, Badge, formatDate, AMBER, TEXT, TEXT_DIM, TEXT_MUTED, BORDER, SURFACE2, td } from '../components/AdminComponents'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const s = data.stats

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Total Users"     value={s.total_users}      sub={`+${s.new_users_today} today`}     icon={Users}     color="#60A5FA" delay={0} />
        <StatCard label="Premium"         value={s.premium_count}    sub={`${s.free_count} free`}             icon={Crown}     color={AMBER}   delay={0.04} />
        <StatCard label="Plans Today"     value={s.plans_today}      sub={`${s.plans_week} this week`}        icon={FileText}  color="#A78BFA" delay={0.08} />
        <StatCard label="Total Plans"     value={s.plans_total}      sub={`${s.saved_plans} saved`}           icon={Bookmark}  color="#34D399" delay={0.12} />
        <StatCard label="Est. Revenue"    value={`GHS ${s.revenue_estimate}`} sub="monthly estimate"          icon={DollarSign} color={AMBER}  delay={0.16} />
        <StatCard label="New This Week"   value={s.new_users_week}   sub="new signups"                        icon={UserPlus}  color="#F87171" delay={0.20} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Card>
          <CardHeader>
            <TrendingUp size={13} color={AMBER} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Signups — Last 14 Days</span>
          </CardHeader>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SparkLine data={data.signups_chart} color="#60A5FA" height={60} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>
              <span>{formatDate(data.signups_chart[0]?.date)}</span>
              <span>{formatDate(data.signups_chart[data.signups_chart.length - 1]?.date)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <BarChart2 size={13} color="#A78BFA" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Plans Generated — Last 14 Days</span>
          </CardHeader>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SparkLine data={data.plans_chart} color="#A78BFA" height={60} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>
              <span>{formatDate(data.plans_chart[0]?.date)}</span>
              <span>{formatDate(data.plans_chart[data.plans_chart.length - 1]?.date)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <Users size={13} color={AMBER} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Recent Signups</span>
        </CardHeader>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {data.recent_users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: TEXT }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize: '0.72rem', color: TEXT_MUTED }}>@{u.username}</div>
                  </td>
                  <td style={td}>{u.email}</td>
                  <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatDate(u.date_joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}