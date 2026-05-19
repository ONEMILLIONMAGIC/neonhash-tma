import { useState, useEffect } from 'react'
import client from '../api/client'

export interface User {
  id: number
  username?: string
  first_name?: string
  photo_url?: string
  hash_power: number
  balance: number
  level: number
  energy: number
  max_energy: number
  referral_code: string
  mining_rate: number
  pending_coins: number
  offline_limit_hours: number
  total_mined: number
  upgrades_owned: number
  referrals_count: number
}

function getTgUser() {
  const tg = window.Telegram?.WebApp
  if (!tg) return null
  const u = tg.initDataUnsafe?.user
  if (!u) return null
  return {
    id: u.id,
    username: (u as any).username,
    first_name: (u as any).first_name,
    photo_url: (u as any).photo_url,
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    setLoading(true)
    try {
      const tgWebApp = window.Telegram?.WebApp as any
      const startParam = tgWebApp?.initDataUnsafe?.start_param || null
      const res = await client.post('/api/auth', { start_param: startParam })
      const apiUser = res.data.user as User
      // Merge TG avatar from WebApp (API doesn't return photo_url)
      const tgData = getTgUser()
      if (tgData?.photo_url && !apiUser.photo_url) {
        apiUser.photo_url = tgData.photo_url
      }
      setUser(apiUser)
      setError(null)
    } catch (e: any) {
      console.error('Auth error:', e)
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUser() }, [])

  return { user, setUser, loading, error, refetch: fetchUser }
}

export type UserContext = ReturnType<typeof useUser>
