import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../api/client'
import type { User } from '../hooks/useUser'

interface Task {
  id: number
  title: string
  description: string
  reward: number
  task_type: 'daily' | 'one_time' | 'referral'
  action_url?: string
  completed: boolean
  icon: string
}

interface Props {
  user: User
  setUser: (u: User) => void
}

const FALLBACK_TASKS: Task[] = [
  { id: 1,  title: 'Daily Login',         description: 'Open the app today.',                     reward: 10,  task_type: 'daily',    completed: false, icon: '📅' },
  { id: 2,  title: 'Claim Your Rewards',  description: 'Claim your mined NEON at least once.',    reward: 25,  task_type: 'daily',    completed: true,  icon: '💰' },
  { id: 3,  title: 'Share NeonHash',      description: 'Share your referral link on Telegram.',   reward: 50,  task_type: 'daily',    completed: false, icon: '📢', action_url: 'https://t.me/share/url?url=NeonHash' },
  { id: 4,  title: 'First Purchase',      description: 'Buy your first upgrade from the shop.',   reward: 100, task_type: 'one_time', completed: false, icon: '🛒' },
  { id: 5,  title: 'Mine 1,000 NEON',    description: 'Accumulate 1,000 NEON total mined.',      reward: 200, task_type: 'one_time', completed: false, icon: '🏆' },
  { id: 6,  title: 'Mine 10,000 NEON',   description: 'Reach 10,000 NEON total mined.',          reward: 500, task_type: 'one_time', completed: false, icon: '💎' },
  { id: 7,  title: 'Reach Level 5',       description: 'Level up your miner to level 5.',         reward: 300, task_type: 'one_time', completed: false, icon: '⭐' },
  { id: 8,  title: 'Invite 1 Friend',     description: 'Get 1 friend to join via referral link.', reward: 150, task_type: 'referral', completed: false, icon: '👥', action_url: 'https://t.me/NeonHashBot' },
  { id: 9,  title: 'Invite 5 Friends',    description: 'Build your mining crew to 5 members.',   reward: 500, task_type: 'referral', completed: false, icon: '🌐', action_url: 'https://t.me/NeonHashBot' },
]

const TYPE_COLORS: Record<string, string> = {
  daily: '#00f5ff',
  one_time: '#f0abfc',
  referral: '#7c3aed',
}

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily',
  one_time: 'Achievement',
  referral: 'Referral',
}

export default function TasksPage({ user, setUser }: Props) {
  const [tasks, setTasks] = useState<Task[]>(FALLBACK_TASKS)
  const [completing, setCompleting] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    client.get('/api/tasks')
      .then(r => setTasks(r.data.tasks))
      .catch(() => { /* keep fallback */ })
  }, [])

  const complete = async (task: Task) => {
    if (completing !== null || task.completed) return
    if (task.action_url) window.open(task.action_url, '_blank')
    setCompleting(task.id)
    try {
      const res = await client.post(`/api/tasks/complete/${task.id}`)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
      setUser({ ...user, balance: user.balance + res.data.reward })
      showToast(`+${res.data.reward} NEON earned!`)
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
      setUser({ ...user, balance: user.balance + task.reward })
      showToast(`+${task.reward} NEON earned!`)
    } finally {
      setCompleting(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const grouped = {
    daily: tasks.filter(t => t.task_type === 'daily'),
    one_time: tasks.filter(t => t.task_type === 'one_time'),
    referral: tasks.filter(t => t.task_type === 'referral'),
  }

  return (
    <div className="px-4 pt-6 pb-32">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="tasks-toast"
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

      <h1 className="gradient-text text-2xl font-bold mb-1">Missions</h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Complete tasks to earn bonus NEON
      </p>

      {(['daily', 'one_time', 'referral'] as const).map(type => {
        const group = grouped[type]
        const color = TYPE_COLORS[type]
        const done = group.filter(t => t.completed).length

        return (
          <section key={type} className="mb-6">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {TYPE_LABELS[type]}
              </span>
              <div className="flex-1 h-px" style={{ background: `${color}22` }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{done}/{group.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {group.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                  style={{
                    border: task.completed
                      ? '1px solid rgba(0,255,136,0.3)'
                      : `1px solid ${color}18`,
                    opacity: task.completed ? 0.7 : 1,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{
                      background: task.completed ? 'rgba(0,255,136,0.15)' : `${color}15`,
                      border: `1px solid ${task.completed ? 'rgba(0,255,136,0.3)' : `${color}25`}`,
                    }}
                  >
                    {task.completed ? '✓' : task.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{task.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {task.description}
                    </div>
                    <div className="text-xs mt-1 font-semibold" style={{ color }}>
                      +{task.reward} NEON
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => complete(task)}
                    disabled={task.completed || completing === task.id}
                    className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200"
                    style={
                      task.completed
                        ? { background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)', minWidth: 56 }
                        : {
                            background: `linear-gradient(135deg, ${color}33, #7c3aed33)`,
                            color,
                            border: `1px solid ${color}44`,
                            minWidth: 56,
                          }
                    }
                  >
                    {completing === task.id ? '...' : task.completed ? 'Done' : 'Go'}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
