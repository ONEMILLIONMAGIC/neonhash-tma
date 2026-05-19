import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MiningCore from '../components/MiningCore'
import type { User } from '../hooks/useUser'
import { useMining } from '../hooks/useMining'

interface Props {
  user: User
  setUser: (u: User) => void
}

export default function MinePage({ user, setUser }: Props) {
  const { pendingCoins, claiming, claim, toast } = useMining(user, setUser)

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-32 min-h-screen">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 z-50 glass rounded-full px-6 py-3"
            style={{
              transform: 'translateX(-50%)',
              border: '1px solid #00f5ff66',
              boxShadow: '0 0 30px #00f5ff44',
              color: '#00f5ff',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header balance */}
      <motion.div
        className="text-center mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Balance
        </div>
        <div className="font-bold" style={{ fontSize: 36 }}>
          <span className="gradient-text">
            {user.balance.toLocaleString('en', { maximumFractionDigits: 2 })}
          </span>
          <span className="text-lg ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>NEON</span>
        </div>
        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ≈ $0.00 USD &nbsp;·&nbsp; Level {user.level} Miner
        </div>
      </motion.div>

      {/* Mining Core */}
      <motion.div
        className="my-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <MiningCore active={true} hashPower={user.hash_power} />
      </motion.div>

      {/* Mining Active badge */}
      <motion.div
        className="flex items-center gap-2 glass rounded-full px-4 py-2 mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ border: '1px solid rgba(0,255,136,0.25)' }}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span style={{ fontSize: 13, color: '#00ff88', fontWeight: 600 }}>Mining Active</span>
      </motion.div>

      {/* Stats card */}
      <motion.div
        className="glass rounded-2xl p-5 w-full max-w-sm mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="grid grid-cols-2 gap-4">
          <StatCell label="Hash Power" color="#00f5ff">
            <span className="font-bold neon-text" style={{ fontSize: 20 }}>
              {user.hash_power}<span className="text-xs ml-1">H/s</span>
            </span>
          </StatCell>
          <StatCell label="Mining Rate" color="#7c3aed">
            <span className="font-bold" style={{ fontSize: 20, color: '#7c3aed' }}>
              {user.mining_rate.toFixed(3)}<span className="text-xs ml-1">/s</span>
            </span>
          </StatCell>
          <div className="col-span-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <StatCell label="Offline Limit" color="#f0abfc">
            <span className="font-bold" style={{ fontSize: 20, color: '#f0abfc' }}>
              {user.offline_limit_hours}<span className="text-xs ml-1">h</span>
            </span>
          </StatCell>
          <StatCell label="Pending" color="#00f5ff">
            <motion.span
              className="font-bold gradient-text"
              style={{ fontSize: 18 }}
              key={Math.floor(pendingCoins * 100)}
            >
              {pendingCoins.toFixed(4)}
            </motion.span>
          </StatCell>
        </div>
      </motion.div>

      {/* Claim button */}
      <motion.button
        onClick={claim}
        disabled={claiming || pendingCoins < 0.0001}
        className="w-full max-w-sm py-4 rounded-2xl font-bold text-white text-lg"
        style={{
          background:
            pendingCoins >= 0.0001
              ? 'linear-gradient(135deg, #00f5ff, #7c3aed)'
              : 'rgba(255,255,255,0.06)',
          color: pendingCoins >= 0.0001 ? 'white' : 'rgba(255,255,255,0.3)',
          boxShadow:
            pendingCoins >= 0.0001
              ? '0 0 40px rgba(0,245,255,0.4), 0 0 80px rgba(124,58,237,0.2)'
              : 'none',
          transition: 'all 0.25s',
        }}
        whileTap={pendingCoins >= 0.0001 ? { scale: 0.97 } : {}}
        whileHover={pendingCoins >= 0.0001 ? { scale: 1.02 } : {}}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {claiming
          ? '⏳ Claiming...'
          : pendingCoins < 0.0001
          ? '⛏ Mining...'
          : `⚡ Claim ${pendingCoins.toFixed(4)} NEON`}
      </motion.button>

      <div className="mt-3 text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Energy: {user.energy}/{user.max_energy}
      </div>
    </div>
  )
}

function StatCell({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: `${color}0d`, border: `1px solid ${color}1a` }}
    >
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      {children}
    </div>
  )
}
