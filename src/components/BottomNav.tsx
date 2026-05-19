import { motion } from 'framer-motion'

type Page = 'mine' | 'shop' | 'tasks' | 'profile'

interface Props {
  current?: Page
  onChange?: (p: Page) => void
  currentPage?: Page
  onNavigate?: (p: Page) => void
}

const TABS: { id: Page; icon: string; label: string }[] = [
  { id: 'mine',    icon: '⛏', label: 'Mine' },
  { id: 'shop',    icon: '🛒', label: 'Shop' },
  { id: 'tasks',   icon: '✅', label: 'Tasks' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav({ current, onChange, currentPage, onNavigate }: Props) {
  const activePage = currentPage ?? current ?? 'mine'
  const handleClick = onNavigate ?? onChange ?? (() => {})

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{
        background: 'rgba(5,5,16,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(0,245,255,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00f5ff44, #7c3aed44, transparent)' }}
      />

      <div className="flex">
        {TABS.map(tab => {
          const active = activePage === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 relative"
            >
              {/* Active top indicator */}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                  style={{
                    width: 28,
                    background: 'linear-gradient(90deg, #00f5ff, #7c3aed)',
                    boxShadow: '0 0 8px #00f5ff',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <motion.span
                style={{
                  fontSize: 20,
                  filter: active ? 'drop-shadow(0 0 6px #00f5ff)' : 'none',
                  transition: 'filter 0.2s',
                }}
                animate={{ scale: active ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {tab.icon}
              </motion.span>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#00f5ff' : 'rgba(255,255,255,0.38)',
                  textShadow: active ? '0 0 8px #00f5ff66' : 'none',
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
