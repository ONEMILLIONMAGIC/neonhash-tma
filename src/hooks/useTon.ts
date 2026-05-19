import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { useState } from 'react'
import client from '../api/client'

// 1 TON = 1_000_000_000 nanoTON
const TON = 1_000_000_000n

export const PACKAGES = [
  { id: 'starter',  name: 'Starter',      price_ton: 0.5,  hash_power: 50,   label: '🟢' },
  { id: 'pro',      name: 'Pro Miner',    price_ton: 1.5,  hash_power: 200,  label: '🔵' },
  { id: 'quantum',  name: 'Quantum',      price_ton: 5,    hash_power: 800,  label: '🟣' },
  { id: 'galactic', name: 'Galactic',     price_ton: 15,   hash_power: 3000, label: '🟡' },
  { id: 'infinity', name: 'Infinity Core',price_ton: 50,   hash_power: 15000,label: '🔴' },
]

export function useTon(projectWallet: string) {
  const wallet = useTonWallet()
  const [ui] = useTonConnectUI()
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isConnected = !!wallet

  const buyPackage = async (pkg: typeof PACKAGES[number]) => {
    if (!isConnected) { ui.openModal(); return }
    setBuying(pkg.id)
    setError(null)
    try {
      const nanotons = BigInt(Math.round(pkg.price_ton * 1_000_000_000))
      const comment = `neonhash:buy:${pkg.id}`
      const commentHex = Buffer.from(comment, 'utf8').toString('hex')

      await ui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: projectWallet,
          amount: nanotons.toString(),
          payload: btoa(String.fromCharCode(...Buffer.from(`\x00\x00\x00\x00${comment}`, 'utf8'))),
        }],
      })

      // Сообщаем бэкенду — он подтвердит через TON API
      await client.post('/api/payments/pending', {
        package_id: pkg.id,
        wallet_address: wallet!.account.address,
        amount_ton: pkg.price_ton,
        hash_power: pkg.hash_power,
      })
    } catch (e: any) {
      if (!e?.message?.includes('User rejects')) {
        setError(e?.message || 'Transaction failed')
      }
    } finally {
      setBuying(null)
    }
  }

  const disconnect = () => ui.disconnect()

  return { wallet, isConnected, buyPackage, buying, error, disconnect }
}
