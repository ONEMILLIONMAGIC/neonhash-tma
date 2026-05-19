import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '../hooks/useUser'

interface Props { user: User; setUser?: (u: User) => void }

const LEVEL_NAMES: Record<number, string> = {
  1: 'Rookie Miner', 2: 'Hash Seeker', 3: 'Block Cruncher',
  4: 'Chain Rider', 5: 'Node Master', 6: 'Hash Oracle',
  7: 'Neon Veteran', 8: 'Quantum Miner', 9: 'Cyber Legend', 10: 'NeonHash God',
}

export default function ProfilePage({ user }: Props) {
  const [copied, setCopied] = useState(false)
  const levelName = LEVEL_NAMES[Math.min(user.level, 10)] ?? 'Miner'
  const initials = ((user.first_name || '') + (user.username || 'N')).trim().slice(0, 2).toUpperCase()
  const referralLink = `https://t.me/neonhash_bot?start=${user.referral_code}`

  const copyReferral = () => {
    navigator.clipboard?.writeText(referralLink).catch(() => {
      // fallback
      const el = document.createElement('textarea')
      el.value = referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareReferral = () => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('⚡ Join NeonHash — cloud mining on TON! Get free 100 NEON bonus!')}`)
    } else {
      copyReferral()
    }
  }

  const stats = [
    { label: 'Total Mined',  value: `${Number(user.total_mined).toFixed(0)} N`, icon: '⛏', color: '#00f5ff' },
    { label: 'Hash Power',   value: `${user.hash_power} H/s`,                   icon: '⚡', color: '#7c3aed' },
    { label: 'Upgrades',     value: `${user.upgrades_owned}`,                    icon: '🔧', color: '#f0abfc' },
    { label: 'Referrals',    value: `${user.referrals_count}`,                   icon: '👥', color: '#00ff88' },
  ]

  return (
    <div className="px-4 pt-6 pb-32 flex flex-col gap-5">
      <AnimatePresence>
        {copied && (
          <motion.div key="copied" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-full px-6 py-3"
            style={{ transform: 'translateX(-50%)', border: '1px solid #00f5ff66', color: '#00f5ff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
            ✓ Referral link copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar + Identity */}
      <motion.div className="flex flex-col items-center gap-4 py-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative">
          <motion.div className="absolute inset-[-4px] rounded-full"
            style={{ border: '2px solid transparent', borderTopColor: '#00f5ff', borderRightColor: 'rgba(0,245,255,0.2)', borderBottomColor: '#7c3aed', borderLeftColor: 'rgba(124,58,237,0.2)' }}
            animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />

          {user.photo_url ? (
            <img src={user.photo_url} alt="avatar" className="w-24 h-24 rounded-full object-cover"
              style={{ border: '2px solid rgba(0,245,255,0.2)', boxShadow: '0 0 40px rgba(0,245,255,0.2)' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.18),rgba(124,58,237,0.18))', border: '2px solid rgba(0,245,255,0.2)', boxShadow: '0 0 40px rgba(0,245,255,0.2)' }}>
              {initials}
            </div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{user.first_name || user.username || 'Miner'}</h2>
          {user.username && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>@{user.username}</p>}
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>ID: {user.id}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.12),rgba(124,58,237,0.12))', border: '1px solid rgba(0,245,255,0.3)' }}>
            <span className="text-xs font-bold" style={{ color: '#00f5ff' }}>Lv.{user.level}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span className="text-xs font-semibold gradient-text">{levelName}</span>
          </div>
        </div>
      </motion.div>

      {/* Balance */}
      <motion.div className="glass rounded-2xl p-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ border: '1px solid rgba(0,245,255,0.2)' }}>
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Balance</div>
        <div className="gradient-text font-bold" style={{ fontSize: 32 }}>
          {user.balance.toLocaleString('en', { maximumFractionDigits: 4 })} <span className="text-lg">NEON</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} className="glass rounded-2xl p-4 flex flex-col gap-2"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
            style={{ border: `1px solid ${stat.color}18` }}>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</span>
            </div>
            <span className="text-base font-bold" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}55` }}>
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Energy bar */}
      <motion.div className="glass rounded-2xl p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ border: '1px solid rgba(240,171,252,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">⚡ Energy</span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>{user.energy}/{user.max_energy}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#f0abfc,#7c3aed)', boxShadow: '0 0 8px #f0abfc55' }}
            initial={{ width: 0 }} animate={{ width: `${(user.energy / user.max_energy) * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }} />
        </div>
      </motion.div>

      {/* Referral Section */}
      <motion.div className="glass rounded-2xl p-5 flex flex-col gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 30px rgba(124,58,237,0.08)' }}>
        <div>
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">🔗 Referral Program</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Earn <span style={{ color: '#f0abfc' }}>150 NEON</span> for every friend you invite
          </p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div>
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Your code</div>
            <div className="font-bold font-mono" style={{ color: '#f0abfc', letterSpacing: 2 }}>{user.referral_code}</div>
          </div>
          <div className="text-right">
            <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Invited</div>
            <div className="font-bold text-xl" style={{ color: '#00ff88' }}>{user.referrals_count}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={copyReferral} className="flex-1 glass rounded-xl py-3 text-sm font-semibold"
            style={{ border: '1px solid rgba(124,58,237,0.3)', color: '#f0abfc' }}>
            📋 Copy Link
          </button>
          <button onClick={shareReferral} className="flex-1 claim-btn rounded-xl py-3 text-sm font-bold text-white">
            📤 Share
          </button>
        </div>
      </motion.div>
    </div>
  )
}
