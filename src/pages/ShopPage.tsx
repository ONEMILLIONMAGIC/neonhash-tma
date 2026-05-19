import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import client from '../api/client'
import type { User } from '../hooks/useUser'
import { PACKAGES } from '../hooks/useTon'

interface Upgrade {
  id: number
  name: string
  description: string
  hash_power_bonus: number
  price: number
  category: string
  level_required: number
  owned: boolean
  icon: string
}

interface Props {
  user: User
  setUser: (u: User) => void
}

const PROJECT_WALLET = import.meta.env.VITE_TON_WALLET || 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ'

const CATEGORY_COLORS: Record<string, string> = {
  mining: '#00f5ff',
  energy: '#f0abfc',
  offline: '#7c3aed',
}

type Tab = 'ton' | 'neon'

export default function ShopPage({ user, setUser }: Props) {
  const [tab, setTab] = useState<Tab>('ton')
  const [upgrades, setUpgrades] = useState<Upgrade[]>([])
  const [buying, setBuying] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const wallet = useTonWallet()
  const [ui] = useTonConnectUI()

  useEffect(() => {
    client.get('/api/upgrades')
      .then(r => setUpgrades(r.data.upgrades))
      .catch(() => {})
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const buyTonPackage = async (pkg: typeof PACKAGES[number]) => {
    if (!wallet) { ui.openModal(); return }
    setBuying(pkg.id)
    try {
      const nanotons = BigInt(Math.round(pkg.price_ton * 1_000_000_000))
      const comment = `neonhash:buy:${pkg.id}:${user.id}`

      await ui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: PROJECT_WALLET,
          amount: nanotons.toString(),
          payload: btoa(unescape(encodeURIComponent(`\x00\x00\x00\x00${comment}`))),
        }],
      })

      await client.post('/api/payments/pending', {
        package_id: pkg.id,
        wallet_address: wallet.account.address,
        amount_ton: pkg.price_ton,
        hash_power: pkg.hash_power,
      })

      showToast(`✅ Payment sent! +${pkg.hash_power} H/s will be added after confirmation`)
    } catch (e: any) {
      if (!e?.message?.includes('rejects') && !e?.message?.includes('cancel')) {
        showToast('Transaction failed, try again')
      }
    } finally {
      setBuying(null)
    }
  }

  const buyNeonUpgrade = async (upg: Upgrade) => {
    if (buying) return
    setBuying(String(upg.id))
    try {
      await client.post(`/api/upgrades/buy/${upg.id}`)
      setUpgrades(prev => prev.map(u => u.id === upg.id ? { ...u, owned: true } : u))
      setUser({ ...user, hash_power: user.hash_power + upg.hash_power_bonus, balance: user.balance - upg.price })
      showToast(`${upg.name} installed! +${upg.hash_power_bonus} H/s`)
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Purchase failed')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{ transform: 'translateX(-50%)', border: '1px solid #00f5ff44', color: '#00f5ff', maxWidth: 320, textAlign: 'center' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="gradient-text text-2xl font-bold mb-1">Shop</h1>

      {/* Wallet status */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Balance: <span className="neon-text font-semibold">{user.balance.toFixed(2)} NEON</span>
        </span>
        {wallet ? (
          <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5" style={{ border: '1px solid #00ff8844' }}>
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #00ff88' }} />
            <span className="text-xs font-semibold" style={{ color: '#00ff88' }}>
              {wallet.account.address.slice(0, 6)}…{wallet.account.address.slice(-4)}
            </span>
          </div>
        ) : (
          <button
            onClick={() => ui.openModal()}
            className="glass rounded-full px-3 py-1.5 text-xs font-semibold neon-text"
            style={{ border: '1px solid #00f5ff44' }}
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['ton', 'neon'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === t
              ? { background: 'linear-gradient(135deg,#00f5ff,#7c3aed)', color: 'white', boxShadow: '0 0 20px #00f5ff44' }
              : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
            }
          >
            {t === 'ton' ? '💎 Buy with TON' : '⚡ Buy with NEON'}
          </button>
        ))}
      </div>

      {/* TON Packages */}
      {tab === 'ton' && (
        <div className="flex flex-col gap-3">
          {!wallet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-4 text-center mb-2"
              style={{ border: '1px solid #00f5ff22' }}
            >
              <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Connect your TON wallet to buy hash power packages
              </p>
              <button onClick={() => ui.openModal()} className="claim-btn px-6 py-2.5 rounded-xl text-sm font-bold text-white">
                Connect Tonkeeper / Wallet
              </button>
            </motion.div>
          )}

          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4"
              style={{ border: '1px solid rgba(0,245,255,0.15)', boxShadow: '0 0 20px rgba(0,245,255,0.04)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 28 }}>{pkg.label}</span>
                  <div>
                    <div className="font-bold text-white">{pkg.name}</div>
                    <div className="text-xs mt-0.5 neon-text">+{pkg.hash_power.toLocaleString()} H/s</div>
                  </div>
                </div>
                <button
                  onClick={() => buyTonPackage(pkg)}
                  disabled={buying === pkg.id}
                  className="claim-btn rounded-xl px-4 py-2.5 font-bold text-white text-sm flex-shrink-0"
                  style={{ minWidth: 90 }}
                >
                  {buying === pkg.id ? '⏳' : `${pkg.price_ton} TON`}
                </button>
              </div>

              {/* Rate */}
              <div className="mt-3 flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>Rate: +{(pkg.hash_power * 0.001).toFixed(1)} NEON/s</span>
                <span>≈ {(pkg.hash_power * 0.001 * 3600 * 24).toFixed(0)} NEON/day</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* NEON Upgrades */}
      {tab === 'neon' && (
        <div className="flex flex-col gap-3">
          {upgrades.map((upg, i) => {
            const color = CATEGORY_COLORS[upg.category] ?? '#00f5ff'
            const canAfford = user.balance >= upg.price
            return (
              <motion.div
                key={upg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-4 flex items-center gap-3"
                style={{ border: upg.owned ? '1px solid rgba(0,255,136,0.3)' : `1px solid ${color}18` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: upg.owned ? 'rgba(0,255,136,0.15)' : `${color}15`, border: `1px solid ${upg.owned ? 'rgba(0,255,136,0.3)' : `${color}25`}` }}>
                  {upg.owned ? '✓' : upg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{upg.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{upg.description}</div>
                  {upg.hash_power_bonus > 0 && <div className="text-xs mt-1" style={{ color }}> +{upg.hash_power_bonus} H/s</div>}
                </div>
                <button
                  onClick={() => buyNeonUpgrade(upg)}
                  disabled={upg.owned || !canAfford || buying === String(upg.id)}
                  className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
                  style={{
                    background: upg.owned ? 'rgba(0,255,136,0.15)' : canAfford ? `${color}15` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${upg.owned ? 'rgba(0,255,136,0.3)' : canAfford ? `${color}44` : 'rgba(255,255,255,0.1)'}`,
                    color: upg.owned ? '#00ff88' : canAfford ? color : 'rgba(255,255,255,0.3)',
                    minWidth: 72,
                  }}
                >
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
