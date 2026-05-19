import { useState, useEffect } from 'react'
import client from '../api/client'

export interface User {
  id: number
  telegram_id?: number
  username?: string
  first_name?: string
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

const MOCK_USER: User = {
  id: 1,
  telegram_id: 501197162,
  username: 'neon_miner',
  first_name: 'Neon',
  hash_power: 42,
  balance: 1234.56,
  level: 7,
  energy: 850,
  max_energy: 1000,
  referral_code: 'NEON42XYZ',
  mining_rate: 0.042,
  pending_coins: 12.34,
  offline_limit_hours: 12,
  total_mined: 98765.43,
  upgrades_owned: 3,
  referrals_count: 0,
}

export function useUser() {
  const [user, setUser] = useState<User>(MOCK_USER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await client.post('/api/auth')
      setUser(res.data.user)
      setError(null)
    } catch {
      // Keep mock data in dev
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return { user, setUser, loading, error, refetch: fetchUser }
}

export type UserContext = ReturnType<typeof useUser>
