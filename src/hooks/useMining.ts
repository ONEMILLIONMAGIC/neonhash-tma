import { useState, useEffect, useRef } from 'react'
import client from '../api/client'
import type { User } from './useUser'

export function useMining(user: User | null, setUser: (u: User) => void) {
  const [pendingCoins, setPendingCoins] = useState(0)
  const [claiming, setClaiming] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const initialPendingRef = useRef<number>(0)

  useEffect(() => {
    if (!user) return
    initialPendingRef.current = user.pending_coins
    startTimeRef.current = Date.now()
    setPendingCoins(user.pending_coins)
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newCoins = initialPendingRef.current + user.mining_rate * elapsed
      setPendingCoins(parseFloat(newCoins.toFixed(6)))
    }, 1000)
    return () => clearInterval(interval)
  }, [user])

  const claim = async () => {
    if (!user || claiming) return
    setClaiming(true)
    try {
      const res = await client.post('/api/mining/claim')
      const { balance, claimed } = res.data
      setUser({ ...user, balance, pending_coins: 0 })
      initialPendingRef.current = 0
      startTimeRef.current = Date.now()
      setPendingCoins(0)
      showToast(`+${claimed.toFixed(4)} NEON claimed!`)
    } catch {
      showToast('Claim failed, try again')
    } finally {
      setClaiming(false)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return { pendingCoins, claiming, claim, toast }
}
