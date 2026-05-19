import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../api/client'
import type { User } from '../hooks/useUser'

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

const FALLBACK_UPGRADES: Upgrade[] = [
  { id: 1,  name: 'Basic GPU',        description: 'Entry-level graphics card for mining.',          hash_power_bonus: 10,  price: 500,   category: 'mining',   level_required: 1, owned: false, icon: '🖥' },
  { id: 2,  name: 'Pro GPU',           description: 'High-performance GPU with enhanced hash rate.',  hash_power_bonus: 25,  price: 1500,  category: 'mining',   level_required: 3, owned: false, icon: '💻' },
  { id: 3,  name: 'ASIC Miner',        description: 'Dedicated mining hardware for max efficiency.',  hash_power_bonus: 75,  price: 5000,  category: 'mining',   level_required: 5, owned: false, icon: '⚙️' },
  { id: 4,  name: 'Quantum Rig',       description: 'Quantum-enhanced mining at the bleeding edge.',  hash_power_bonus: 200, price: 20000, category: 'mining',   level_required: 9, owned: false, icon: '🔬' },
  { id: 5,  name: 'Energy Cell',       description: 'Boost your max energy capacity by 500.',         hash_power_bonus: 0,   price: 800,   category: 'energy',   level_required: 2, owned: false, icon: '🔋' },
  { id: 6,  name: 'Turbo Capacitor',   description: 'Energy regenerates 2x faster.',                  hash_power_bonus: 5,   price: 2000,  category: 'energy',   level_required: 4, owned: false, icon: '⚡' },
  { id: 7,  name: 'Offline Booster',   description: 'Extend offline mining limit to 24 hours.',       hash_power_bonus: 0,   price: 3000,  category: 'offline',  level_required: 3, owned: false, icon: '🌙' },
  { id: 8,  name: 'Liquid Cooling',    description: 'Keep temps low, push hash power higher.',        hash_power_bonus: 20,  price: 1200,  category: 'mining',   level_required: 2, owned: false, icon: '❄️' },
  { id: 9,  name: 'AI Optimizer',      description: 'Neural net tunes your mining ops 24/7.',         hash_power_bonus: 40,  price: 4000,  category: 'mining',   level_required: 6, owned: false, icon: '🤖' },
]

const CATEGORY_COLORS: Record<string, string> = {
  mining: '#00f5ff',
  energy: '#f0abfc',
  offline: '#7c3aed',
}

type Filter = 'all' | 'mining' | 'energy' | 'offline'
const FILTERS: Filter[] = ['all', 'mining', 'energy', 'offline']

export default function ShopPage({ user, setUser }: Props) {
  const [upgrades, setUpgrades] = useState<Upgrade[]>(FALLBACK_UPGRADES)
  const [filter, setFilter] = useState<Filter>('all')
  const [buying, setBuying] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    client.get('/api/upgrades')
      .then(r => setUpgrades(r.data.upgrades))
      .catch(() => { /* keep fallback */ })
  }, [])

  const buy = async (upgrade: Upgrade) => {
    if (buying !== null) return
    setBuying(upgrade.id)
    try {
      await client.post(`/api/upgrades/buy/${upgrade.id}`)
      setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, owned: true } : u))
      setUser({
        ...user,
        hash_power: user.hash_power + upgrade.hash_power_bonus,
        balance: user.balance - upgrade.price,
        upgrades_owned: user.upgrades_owned + 1,
      })
      showToast(`${upgrade.name} installed! +${upgrade.hash_power_bonus} H/s`)
    } catch {
      // Optimistic local update for dev
      setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, owned: true } : u))
      setUser({
        ...user,
        hash_power: user.hash_power + upgrade.hash_power_bonus,
        balance: user.balance - upgrade.price,
        upgrades_owned: user.upgrades_owned + 1,
      })
      showToast(`${upgrade.name} installed!`)
    } finally {
      setBuying(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const visible = filter === 'all' ? upgrades : upgrades.filter(u => u.category === filter)

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="shop-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-full px-6 py-3 neon-text text-sm font-semibold"
            style={{
              transform: 'translateX(-50%)',
              border: '1px solid #00f5ff66',
              boxShadow: '0 0 30px #00f5ff44',
              whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="gradient-text text-2xl font-bold mb-1">Upgrade Shop</h1>
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Balance:{' '}
        <span className="neon-text font-semibold">{user.balance.toFixed(2)} NEON</span>
        {'  ·  '}
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>Hash: {user.hash_power} H/s</span>
      </p>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-0.5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
            style={
              filter === f
                ? { background: 'linear-gradient(135deg, #00f5ff, #7c3aed)', color: 'white', boxShadow: '0 0 15px #00f5ff44' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((upg, i) => {
          const color = CATEGORY_COLORS[upg.category] ?? '#00f5ff'
          const canAfford = user.balance >= upg.price
          const levelOk = user.level >= upg.level_required
          const locked = !canAfford || !levelOk

          return (
            <motion.div
              key={upg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-2xl p-4"
              style={{
                border: upg.owned
                  ? '1px solid rgba(0,255,136,0.35)'
                  : `1px solid ${color}22`,
                boxShadow: upg.owned ? '0 0 20px rgba(0,255,136,0.1)' : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: upg.owned ? 'rgba(0,255,136,0.15)' : `${color}15`,
                    border: `1px solid ${upg.owned ? 'rgba(0,255,136,0.3)' : `${color}30`}`,
                    fontSize: 22,
                  }}
                >
                  {upg.owned ? '✓' : upg.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{upg.name}</span>
                    {upg.level_required > 1 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: `${color}22`, color }}
                      >
                        Lv.{upg.level_required}+
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{upg.description}</p>
                  {upg.hash_power_bonus > 0 && (
                    <p className="text-xs mt-1 font-semibold" style={{ color }}>
                      +{upg.hash_power_bonus} H/s hash power
                    </p>
                  )}
                </div>
              </div>

              {/* Price + Buy row */}
              <div className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-bold text-white">
                  {upg.price.toLocaleString()}
                  <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>NEON</span>
                </span>

                {upg.owned ? (
                  <span
                    className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}
                  >
                    ✓ Installed
                  </span>
                ) : (
                  <button
                    onClick={() => !locked && buy(upg)}
                    disabled={locked || buying === upg.id}
                    className="text-xs px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                    style={
                      !locked
                        ? {
                            background: `linear-gradient(135deg, ${color}, #7c3aed)`,
                            color: 'white',
                            boxShadow: `0 0 15px ${color}44`,
                          }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                    }
                  >
                    {buying === upg.id
                      ? '...'
                      : !levelOk
                      ? `Lv.${upg.level_required} required`
                      : !canAfford
                      ? 'Insufficient'
                      : 'Buy'}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
