import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { User } from '../hooks/useUser'

interface Props {
  user: User
  setUser: (u: User) => void
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Rookie Miner',
  2: 'Hash Seeker',
  3: 'Block Cruncher',
  4: 'Chain Rider',
  5: 'Node Master',
  6: 'Hash Oracle',
  7: 'Neon Veteran',
  8: 'Quantum Miner',
  9: 'Cyber Legend',
  10: 'NeonHash God',
}

export default function ProfilePage({ user }: Props) {
  const [copied, setCopied] = useState(false)
  const levelName = LEVEL_NAMES[Math.min(user.level, 10)] ?? 'Unknown'
  const initials = ((user.first_name ?? '') + (user.username ?? 'NN')).slice(0, 2).toUpperCase()

  const copyReferral = () => {
    const link = `https://t.me/NeonHashBot?start=${user.referral_code}`
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = [
    { label: 'Total Mined',  value: `${Number(user.total_mined).toFixed(0)} N`, icon: '⛏', color: '#00f5ff' },
    { label: 'Hash Power',   value: `${user.hash_power} H/s`,                   icon: '⚡', color: '#7c3aed' },
    { label: 'Upgrades',     value: `${user.upgrades_owned}`,                    icon: '🔧', color: '#f0abfc' },
    { label: 'Level',        value: `#${user.level}`,                            icon: '🏆', color: '#00f5ff' },
  ]

  return (
    <div className="px-4 pt-6 pb-32 flex flex-col gap-5">
      {/* Copied toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            key="copied-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-full px-6 py-3"
            style={{
              transform: 'translateX(-50%)',
              border: '1px solid #00f5ff66',
              color: '#00f5ff',
              fontWeight: 600,
              fontSize: 14,
              whiteSpace: 'nowrap',
            }}
          >
            ✓ Link copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar + Identity */}
      <motion.div
        className="flex flex-col items-center gap-4 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          {/* Spinning ring */}
          <motion.div
            className="absolute inset-[-4px] rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#00f5ff',
              borderRightColor: 'rgba(0,245,255,0.2)',
              borderBottomColor: '#7c3aed',
              borderLeftColor: 'rgba(124,58,237,0.2)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.18), rgba(124,58,237,0.18))',
              border: '2px solid rgba(0,245,255,0.2)',
              boxShadow: '0 0 40px rgba(0,245,255,0.2)',
            }}
          >
            {initials}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white">{user.first_name ?? user.username ?? 'Miner'}</h2>
          {user.username && (
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>@{user.username}</p>
          )}
          <div
            className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(124,58,237,0.12))',
              border: '1px solid rgba(0,245,255,0.3)',
              boxShadow: '0 0 20px rgba(0,245,255,0.12)',
            }}
          >
            <span className="text-xs font-bold" style={{ color: '#00f5ff' }}>Lv.{user.level}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span className="text-xs font-semibold gradient-text">{levelName}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass rounded-2xl p-4 flex flex-col gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            style={{ border: `1px solid ${stat.color}18` }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {stat.label}
              </span>
            </div>
            <span
              className="text-base font-bold"
              style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}55` }}
            >
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Energy bar */}
      <motion.div
        className="glass rounded-2xl p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ border: '1px solid rgba(240,171,252,0.2)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <span>⚡</span> Energy
          </span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {user.energy} / {user.max_energy}
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #f0abfc, #7c3aed)',
              boxShadow: '0 0 8px #f0abfc55',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(user.energy / user.max_energy) * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Referral Section */}
      <motion.div
        className="glass rounded-2xl p-5 flex flex-col gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{ border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 30px rgba(124,58,237,0.08)' }}
      >
        <div>
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <span>🔗</span> Referral Program
          </h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Earn 150 NEON for every friend you invite
          </p>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Your Code
            </p>
            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: '#f0abfc' }}>
              {user.referral_code}
            </p>
          </div>
          <motion.button
            onClick={copyReferral}
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: copied
                ? 'rgba(0,255,136,0.25)'
                : 'linear-gradient(135deg, #7c3aed, #f0abfc)',
              color: copied ? '#00ff88' : 'white',
              boxShadow: copied ? '0 0 15px rgba(0,255,136,0.3)' : '0 0 15px rgba(124,58,237,0.4)',
              transition: 'all 0.2s',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl py-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-bold text-white">{user.referrals_count}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Invited</p>
          </div>
          <div className="glass rounded-xl py-3 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-bold neon-text">{user.referrals_count * 150}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>NEON Earned</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
