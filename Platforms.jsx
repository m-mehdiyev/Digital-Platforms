import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [role, setRole] = useState(null)
  const [platformId, setPlatformId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokenData, setTokenData] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setLoading(false)
      return
    }

    validateToken(token)
  }, [])

  async function validateToken(token) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('admin_tokens')
        .select('*')
        .eq('token', token)
        .eq('active', true)
        .single()

      if (error || !data) {
        setRole(null)
      } else {
        setRole(data.role) // 'super_admin' | 'platform_admin'
        setPlatformId(data.platform_id)
        setTokenData(data)
        // Save token to sessionStorage for navigation
        sessionStorage.setItem('admin_token', token)
        sessionStorage.setItem('admin_role', data.role)
        if (data.platform_id) {
          sessionStorage.setItem('admin_platform_id', data.platform_id)
        }
      }
    } catch (e) {
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  return { role, platformId, loading, tokenData, isSuperAdmin: role === 'super_admin' }
}

export function getStoredAuth() {
  return {
    token: sessionStorage.getItem('admin_token'),
    role: sessionStorage.getItem('admin_role'),
    platformId: sessionStorage.getItem('admin_platform_id'),
  }
}
