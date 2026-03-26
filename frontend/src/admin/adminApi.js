import axios from 'axios'

const adminApi = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

adminApi.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      window.location.href = '/admin-portal/login'
    }
    return Promise.reject(err)
  }
)

export const adminAPI = {
  login:              (data) => adminApi.post('/admin-portal/login/', data),
  dashboard:          () => adminApi.get('/admin-portal/dashboard/'),
  users:              (params) => adminApi.get('/admin-portal/users/', { params }),
  userDetail:         (id) => adminApi.get(`/admin-portal/users/${id}/`),
  userAction:         (id, action) => adminApi.post(`/admin-portal/users/${id}/action/`, { action }),
  plans:              (params) => adminApi.get('/admin-portal/plans/', { params }),
  deletePlan:         (id) => adminApi.delete(`/admin-portal/plans/${id}/delete/`),
  aiMonitor:          () => adminApi.get('/admin-portal/ai/'),
  payments:           () => adminApi.get('/admin-portal/payments/'),
  notifications:      () => adminApi.get('/admin-portal/notifications/'),
  broadcast:          (data) => adminApi.post('/admin-portal/notifications/broadcast/', data),
  achievements:       () => adminApi.get('/admin-portal/achievements/'),
  createAchievement:  (data) => adminApi.post('/admin-portal/achievements/create/', data),
  system:             () => adminApi.get('/admin-portal/system/'),
  runCommand:         (command) => adminApi.post('/admin-portal/system/run-command/', { command }),
}

export default adminApi