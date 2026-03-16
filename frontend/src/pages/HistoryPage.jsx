import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Trash2, ChevronRight } from 'lucide-react'
import { mealsAPI } from '../api/client'
import ConfirmModal from '../components/ui/ConfirmModal'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [planToDelete, setPlanToDelete] = useState(null)

  useEffect(() => {
    mealsAPI.history()
      .then((res) => setPlans(res.data))
      .catch(() => toast.error('Failed to load history.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return
    setDeleting(true)
    try {
      await mealsAPI.deletePlan(planToDelete.id)
      setPlans((p) => p.filter((plan) => plan.id !== planToDelete.id))
      toast.success('Plan deleted.')
      setPlanToDelete(null)
    } catch {
      toast.error('Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#28281E' }}>Plan History</h1>
        <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginTop: '0.25rem' }}>All your meal plans in one place</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 20 }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No plans yet</h3>
          <p style={{ color: '#A8A89E', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate your first meal plan to see it here.</p>
          <Link to="/generate" className="btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Generate a Plan
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
                animation: `fadeUp 0.4s ease forwards`,
                animationDelay: `${i * 0.04}s`,
                opacity: 0,
              }}
            >
              <div style={{ width: 48, height: 48, background: '#f0fdf4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                🍽️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#28281E', marginBottom: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {plan.title || `Week of ${plan.week_start_date}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={plan.is_partial ? 'badge-orange' : 'badge-green'}>
                    {plan.is_partial ? '3-Day Preview' : '7-Day Plan'}
                  </span>
                  {plan.is_saved && <span className="badge-yellow">📌 Saved</span>}
                  <span style={{ fontSize: '0.75rem', color: '#C8C8BE', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={11} /> {plan.week_start_date}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => setPlanToDelete(plan)}
                  style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8C8BE', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C8C8BE' }}
                >
                  <Trash2 size={14} />
                </button>
                <Link
                  to={`/plans/${plan.id}`}
                  style={{ width: 32, height: 32, borderRadius: 10, background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#68685E', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#2D6A4F' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#F5F5F0'; e.currentTarget.style.color = '#68685E' }}
                >
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        icon="🗑️"
        title="Delete this plan?"
        message={`"${planToDelete?.title || `Week of ${planToDelete?.week_start_date}`}" will be permanently deleted and cannot be recovered.`}
        confirmText="Yes, Delete"
        danger
      />
    </div>
  )
}