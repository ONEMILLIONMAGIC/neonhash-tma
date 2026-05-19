import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import client from '../api/client'
import type { User } from '../hooks/useUser'

interface Props { user: User; setUser: (u: User) => void }

const TON_WALLET = import.meta.env.VITE_TON_WALLET || 'UQCymXWtp4gvfW5udZ_HOxceInxEf_GCgen6obl-6l2U4xXZ'

const PACKAGES = [
  { id: 'starter',  name: 'Starter',       price_ton: 0.5,  stars: 250,   hash_power: 50,    icon: '🟢' },
  { id: 'pro',      name: 'Pro Miner',     price_ton: 1.5,  stars: 750,   hash_power: 200,   icon: '🔵' },
  { id: 'quantum',  name: 'Quantum',       price_ton: 5,    stars: 2500,  hash_power: 800,   icon: '🟣' },
  { id: 'galactic', name: 'Galactic',      price_ton: 15,   stars: 7500,  hash_power: 3000,  icon: '🟡' },
  { id: 'infinity', name: 'Infinity Core', price_ton: 50,   stars: 25000, hash_power: 15000, icon: '🔴' },
]

type PayMethod = 'ton' | 'stars' | 'neon'

export default function ShopPage({ user, setUser }: Props) {
  const [method, setMethod] = useState<PayMethod>('ton')
  const [upgrades, setUpgrades] = useState<any[]>([])
  const [buying, setBuying] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const wallet = useTonWallet()
  const [ui] = useTonConnectUI()

  useEffect(() => {
    client.get('/api/upgrades').then(r => setUpgrades(r.data.upgrades)).catch(() => {})
  }, [])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  // ── TON purchase ─────────────────────────────────────────────
  const buyWithTon = async (pkg: typeof PACKAGES[0]) => {
    if (!wallet) { ui.openModal(); return }
    setBuying(pkg.id)
    try {
      const nano = Math.round(pkg.price_ton * 1_000_000_000).toString()
      // Simple transfer — no payload to avoid encoding issues
      await ui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: TON_WALLET, amount: nano }],
      })
      // Immediately add hash power after successful TON transaction
      const confirmRes = await client.post('/api/payments/confirm-ton', {
        package_id: pkg.id,
        wallet_address: wallet.account.address,
        amount_ton: pkg.price_ton,
        hash_power: pkg.hash_power,
      })
      setUser({ ...user, hash_power: confirmRes.data.hash_power })
      showToast(`✅ +${pkg.hash_power} H/s added! Mining rate increased!`)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (!msg.includes('reject') && !msg.includes('cancel') && !msg.includes('declined')) {
        showToast(`Error: ${msg.slice(0, 60) || 'Transaction failed'}`, false)
      }
    } finally { setBuying(null) }
  }

  // ── Stars purchase ───────────────────────────────────────────
  const buyWithStars = async (pkg: typeof PACKAGES[0]) => {
    setBuying(pkg.id)
    try {
      const res = await client.post('/api/payments/stars-invoice', { package_id: pkg.id })
      const { invoice_url, hash_power } = res.data
      const tg = window.Telegram?.WebApp as any
      if (tg?.openInvoice) {
        tg.openInvoice(invoice_url, async (status: string) => {
          if (status === 'paid') {
            await client.post('/api/payments/stars-confirm', { package_id: pkg.id, hash_power })
            setUser({ ...user, hash_power: user.hash_power + hash_power })
            showToast(`⭐ Stars paid! +${hash_power} H/s added!`)
          } else if (status === 'failed') {
            showToast('Payment failed', false)
          }
          setBuying(null)
        })
      } else {
        // fallback — open link in browser
        window.open(invoice_url, '_blank')
        setBuying(null)
      }
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Stars payment failed', false)
      setBuying(null)
    }
  }

  // ── NEON upgrade ─────────────────────────────────────────────
  const buyWithNeon = async (upg: any) => {
    if (buying) return
    setBuying(String(upg.id))
    try {
      await client.post(`/api/upgrades/buy/${upg.id}`)
      setUpgrades(prev => prev.map(u => u.id === upg.id ? { ...u, owned: true } : u))
      setUser({ ...user, hash_power: user.hash_power + upg.hash_power_bonus, balance: user.balance - upg.price })
      showToast(`${upg.name} installed! +${upg.hash_power_bonus} H/s`)
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Purchase failed', false)
    } finally { setBuying(null) }
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{ transform: 'translateX(-50%)', border: `1px solid ${toast.ok ? '#00f5ff44' : '#ff444444'}`,
              color: toast.ok ? '#00f5ff' : '#ff6666', maxWidth: 320, textAlign: 'center' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="gradient-text text-2xl font-bold mb-1">Shop</h1>
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Balance: <span className="neon-text font-semibold">{user.balance.toFixed(2)} NEON</span>
        {wallet && <span className="ml-3" style={{ color: '#00ff88', fontSize: 11 }}>● {wallet.account.address.slice(0,6)}…{wallet.account.address.slice(-4)}</span>}
      </p>

      {/* Payment method tabs */}
      <div className="flex gap-2 mb-5">
        {([['ton','💎 TON'],['stars','⭐ Stars'],['neon','⚡ NEON']] as [PayMethod,string][]).map(([m,label]) => (
          <button key={m} onClick={() => setMethod(m)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={method === m
              ? { background: 'linear-gradient(135deg,#00f5ff,#7c3aed)', color: 'white', boxShadow: '0 0 15px #00f5ff44' }
              : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* TON or Stars packages */}
      {(method === 'ton' || method === 'stars') && (
        <div className="flex flex-col gap-3">
          {method === 'ton' && !wallet && (
            <div className="glass rounded-2xl p-4 text-center mb-2" style={{ border: '1px solid #00f5ff22' }}>
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Connect TON wallet to buy</p>
              <button onClick={() => ui.openModal()} className="claim-btn px-6 py-2 rounded-xl text-sm font-bold text-white">
                Connect Wallet
              </button>
            </div>
          )}
          {PACKAGES.map((pkg, i) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(0,245,255,0.12)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 26 }}>{pkg.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{pkg.name}</div>
                    <div className="neon-text text-xs">+{pkg.hash_power.toLocaleString()} H/s</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      +{(pkg.hash_power * 0.001 * 86400).toFixed(0)} NEON/day
                    </div>
                  </div>
                </div>
                <button onClick={() => method === 'ton' ? buyWithTon(pkg) : buyWithStars(pkg)}
                  disabled={buying === pkg.id}
                  className="claim-btn rounded-xl px-4 py-2.5 font-bold text-white text-sm flex-shrink-0"
                  style={{ minWidth: 100 }}>
                  {buying === pkg.id ? '⏳' : method === 'ton' ? `${pkg.price_ton} TON` : `${pkg.stars.toLocaleString()} ⭐`}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* NEON upgrades */}
      {method === 'neon' && (
        <div className="flex flex-col gap-3">
          {upgrades.map((upg, i) => {
            const color = upg.category === 'mining' ? '#00f5ff' : upg.category === 'energy' ? '#f0abfc' : '#7c3aed'
            const canAfford = user.balance >= upg.price
            return (
              <motion.div key={upg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-4 flex items-center gap-3"
                style={{ border: upg.owned ? '1px solid rgba(0,255,136,0.3)' : `1px solid ${color}18` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: upg.owned ? 'rgba(0,255,136,0.15)' : `${color}15` }}>
                  {upg.owned ? '✓' : upg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{upg.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{upg.description}</div>
                  {upg.hash_power_bonus > 0 && <div className="text-xs mt-1" style={{ color }}>+{upg.hash_power_bonus} H/s</div>}
                </div>
                <button onClick={() => buyWithNeon(upg)} disabled={upg.owned || !canAfford || buying === String(upg.id)}
                  className="rounded-xl px-3 py-2 text-xs font-semibold flex-shrink-0"
                  style={{ background: upg.owned ? 'rgba(0,255,136,0.15)' : canAfford ? `${color}15` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${upg.owned ? 'rgba(0,255,136,0.3)' : canAfford ? `${color}44` : 'rgba(255,255,255,0.1)'}`,
                    color: upg.owned ? '#00ff88' : canAfford ? color : 'rgba(255,255,255,0.3)', minWidth: 72 }}>
                  {buying === String(upg.id) ? '...' : upg.owned ? 'Owned' : `${upg.price} N`}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
