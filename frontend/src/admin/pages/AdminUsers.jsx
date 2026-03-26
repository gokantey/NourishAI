import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Crown, ChevronRight } from 'lucide-react'
import { adminAPI } from '../adminApi'
import { Card, CardHeader, SectionHeader, SearchBar, Badge, ActionBtn, ConfirmModal, LoadingSpinner, TableRow, formatDate, AMBER, TEXT, TEXT_DIM, TEXT_MUTED, BORDER, SURFACE2, td, th } from '../components/AdminComponents'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [tier, setTier] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.users({ q, tier, page })
      setUsers(res.data.users)
      setTotal(res.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [q, tier, page]) // eslint-disable-line

  const handleAction = (userId, action, label, danger = false) => {
    setConfirm({ userId, action, label, danger })
  }

  const executeAction = async () => {
    const { userId, action } = confirm
    setConfirm(null)
    try {
      const res = await adminAPI.userAction(userId, action)
      toast.success(res.data.message)
      fetch()
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionHeader title={`Users (${total})`} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={q} onChange={v => { setQ(v); setPage(1) }} placeholder="Search by name, email, username..." />
        <select value={tier} onChange={e => { setTier(e.target.value); setPage(1) }}
          style={{ padding: '0.5rem 0.875rem', background: SURFACE2, border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, color: TEXT_DIM, fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none' }}>
          <option value="">All tiers</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User', 'Email', 'Tier', 'Plans', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <TableRow key={u.id} onClick={() => navigate(`/admin-portal/users/${u.id}`)}>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: TEXT, whiteSpace: 'nowrap' }}>{u.name || u.username}</div>
                      <div style={{ fontSize: '0.7rem', color: TEXT_MUTED }}>@{u.username}</div>
                    </td>
                    <td style={{ ...td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                    <td style={td}>
                      <Badge color={u.subscription_tier === 'premium' ? AMBER : 'rgba(240,245,240,0.4)'}>
                        {u.subscription_tier === 'premium' ? '✦ Premium' : 'Free'}
                      </Badge>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>{u.plan_count}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDate(u.date_joined)}</td>
                    <td style={td}>
                      <Badge color={u.is_active ? '#34D399' : '#F87171'}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {u.subscription_tier === 'free'
                          ? <ActionBtn small onClick={() => handleAction(u.id, 'upgrade', `Upgrade ${u.username} to Premium`)} color={AMBER}>Upgrade</ActionBtn>
                          : <ActionBtn small onClick={() => handleAction(u.id, 'downgrade', `Downgrade ${u.username}`, true)} color="#F87171">Downgrade</ActionBtn>}
                        {u.is_active
                          ? <ActionBtn small onClick={() => handleAction(u.id, 'suspend', `Suspend ${u.username}`, true)} color="#F87171">Suspend</ActionBtn>
                          : <ActionBtn small onClick={() => handleAction(u.id, 'activate', `Activate ${u.username}`)} color="#34D399">Activate</ActionBtn>}
                      </div>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <ConfirmModal
        open={!!confirm}
        title={confirm?.label || 'Confirm Action'}
        message="This action will take effect immediately."
        danger={confirm?.danger}
        onConfirm={executeAction}
        onCancel={() => setConfirm(null)}
      />

      {total > 20 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <ActionBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} small>← Prev</ActionBtn>
          <span style={{ fontSize: '0.82rem', color: TEXT_MUTED, fontFamily: 'var(--font-body)' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <ActionBtn onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} small>Next →</ActionBtn>
        </div>
      )}
    </div>
  )
}