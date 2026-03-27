import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Crown, Target } from 'lucide-react'
import { adminAPI } from '../adminApi'
import { Card, CardHeader, Badge, ActionBtn, ConfirmModal, LoadingSpinner, MiniBar } from '../components/AdminComponents'
import { formatDate, AMBER, TEXT, TEXT_DIM, TEXT_MUTED, SURFACE2 } from '../components/adminConstants'
import toast from 'react-hot-toast'

export default function AdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    adminAPI.userDetail(userId).then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, []) // eslint-disable-line

  const handleAction = async (action, label) => {
    if (!window.confirm(`${label}?`)) return
    try {
      const res = await adminAPI.userAction(userId, action)
      toast.success(res.data.message)
      if (action === 'delete') navigate('/admin-portal/users')
      else fetch()
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed.') }
  }

  if (loading) return <LoadingSpinner />
  if (!data) return null

  const { user, profile, plans, streak } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        <button onClick={() => navigate('/admin-portal/users')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, fontSize: '0.82rem', fontFamily: 'var(--font-body)', padding: 0 }}>
          <ChevronLeft size={14} /> Users
        </button>
        <span style={{ color: TEXT_MUTED }}>›</span>
        <span style={{ fontSize: '0.82rem', color: TEXT_DIM, fontFamily: 'var(--font-body)' }}>{user.username}</span>
      </div>

      {/* Header */}
      <Card>
        <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${AMBER}, #D4841A)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A1410', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: TEXT }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: '0.82rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>@{user.username} · {user.email}</div>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                <Badge color={profile.subscription_tier === 'premium' ? AMBER : 'rgba(240,245,240,0.4)'}>
                  {profile.subscription_tier === 'premium' ? '✦ Premium' : 'Free'}
                </Badge>
                <Badge color={user.is_active ? '#34D399' : '#F87171'}>{user.is_active ? 'Active' : 'Suspended'}</Badge>
                {user.is_staff && <Badge color="#A78BFA">Staff</Badge>}
                <span style={{ fontSize: '0.72rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)', alignSelf: 'center' }}>Joined {formatDate(user.date_joined)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {profile.subscription_tier === 'free'
              ? <ActionBtn onClick={() => handleAction('upgrade', `Upgrade ${user.username} to Premium`)} color={AMBER}>Upgrade to Premium</ActionBtn>
              : <ActionBtn onClick={() => handleAction('downgrade', `Downgrade ${user.username}`)} color="#F87171">Downgrade to Free</ActionBtn>}
            {user.is_active
              ? <ActionBtn onClick={() => handleAction('suspend', `Suspend ${user.username}`)} color="#F87171">Suspend</ActionBtn>
              : <ActionBtn onClick={() => handleAction('activate', `Activate ${user.username}`)} color="#34D399">Activate</ActionBtn>}
            <ActionBtn onClick={() => handleAction('delete', `Permanently delete ${user.username} — this cannot be undone`)} color="#F87171">Delete User</ActionBtn>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Profile stats */}
        <Card>
          <CardHeader><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Profile</span></CardHeader>
          <div style={{ padding: '1rem' }}>
            {[
              { label: 'BMI', value: profile.bmi ? `${profile.bmi} (${profile.bmi_category})` : '—' },
              { label: 'Daily Calories', value: profile.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : '—' },
              { label: 'Water Target', value: profile.daily_water_intake ? `${profile.daily_water_intake}L/day` : '—' },
              { label: 'Fitness Goal', value: profile.fitness_goal?.replace(/_/g, ' ') || '—' },
              { label: 'Diet', value: profile.dietary_preference || '—' },
              { label: 'Region', value: profile.region?.replace(/_/g, ' ') || '—' },
              { label: 'Budget', value: profile.budget ? `₵${profile.budget}/week` : '—' },
              { label: 'Generations', value: profile.plan_generations_count || 0 },
              { label: 'Allergies', value: profile.allergies?.join(', ') || 'None' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <span style={{ fontSize: '0.8rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>{label}</span>
                <span style={{ fontSize: '0.8rem', color: TEXT_DIM, fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Streak + Plans count */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {streak && (
            <Card>
              <CardHeader><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Health Streak</span></CardHeader>
              <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                {[
                  { label: 'Current', value: `${streak.current}d`, color: '#C8F135' },
                  { label: 'Longest', value: `${streak.longest}d`, color: AMBER },
                  { label: 'Total Active', value: `${streak.total_active}d`, color: '#A78BFA' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: SURFACE2, borderRadius: 10, padding: '0.75rem 0.5rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.65rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader><span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: TEXT }}>Recent Plans</span></CardHeader>
            <div>
              {plans.slice(0, 6).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1rem', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: TEXT_DIM, fontFamily: 'var(--font-body)' }}>{p.title || `Plan ${p.id}`}</div>
                    <div style={{ fontSize: '0.68rem', color: TEXT_MUTED }}>{formatDate(p.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {p.is_saved && <Badge color={AMBER} small>Saved</Badge>}
                    <Badge color={p.is_partial ? '#F87171' : '#34D399'}>{p.is_partial ? '3-Day' : '7-Day'}</Badge>
                  </div>
                </div>
              ))}
              {plans.length === 0 && <div style={{ padding: '1.5rem', textAlign: 'center', color: TEXT_MUTED, fontSize: '0.82rem', fontFamily: 'var(--font-body)' }}>No plans yet</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}