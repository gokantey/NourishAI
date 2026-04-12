import { useEffect, useRef } from 'react'
import { authAPI } from '../../api/client'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function GoogleAuthButton({ label = 'Continue with Google', onError }) {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const btnRef = useRef(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !btnRef.current) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await authAPI.googleAuth(response.credential)
          const { tokens, user, onboarding_complete, subscription_tier, is_new_user } = res.data
          setAuth(user, tokens, onboarding_complete, subscription_tier, res.data.has_password ?? false)
          toast.success(is_new_user ? `Welcome to NourishAI, ${user.first_name}! 🌿` : `Welcome back, ${user.first_name}!`)
          navigate(onboarding_complete ? '/dashboard' : '/onboarding')
        } catch (err) {
          const msg = err.response?.data?.error || 'Google sign-in failed.'
          if (onError) onError(msg)
          else toast.error(msg)
        }
      },
    })

    window.google.accounts.id.renderButton(btnRef.current, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'filled_black',
      text: 'continue_with',
      size: 'large',
      logo_alignment: 'left',
      width: btnRef.current.offsetWidth || 360,
    })
  }, [])  // eslint-disable-line

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }}>
      <div ref={btnRef} style={{ width: '100%' }} />
    </div>
  )
}