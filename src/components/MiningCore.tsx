import { motion } from 'framer-motion'

interface Props {
  active?: boolean
  hashPower?: number
}

// Orbit dot positions: top/right/bottom/left + two diagonals
const ORBIT_DOTS = [
  { angle: 0,   color: '#00f5ff', size: 12, ring: 200, speed: 12 },
  { angle: 180, color: '#7c3aed', size: 8,  ring: 200, speed: 12 },
  { angle: 90,  color: '#7c3aed', size: 10, ring: 156, speed: 7  },
  { angle: 270, color: '#f0abfc', size: 8,  ring: 156, speed: 7  },
  { angle: 45,  color: '#00f5ff', size: 6,  ring: 120, speed: 10 },
  { angle: 225, color: '#f0abfc', size: 5,  ring: 120, speed: 10 },
]

// Floating ambient particles
const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 18 + i * 9,
  y: 12 + (i % 4) * 19,
  color: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#7c3aed' : '#f0abfc',
  size: 2 + (i % 3),
  duration: 1.8 + i * 0.25,
  delay: i * 0.18,
}))

export default function MiningCore({ active = true, hashPower = 1 }: Props) {
  const glowColor = active ? '#00f5ff' : '#7c3aed44'
  const intensity = Math.min(1, hashPower / 100)
  const coreGlow = active
    ? `0 0 ${40 + intensity * 30}px ${glowColor}88, 0 0 ${80 + intensity * 40}px ${glowColor}33, inset 0 0 30px ${glowColor}22`
    : '0 0 20px #7c3aed33, inset 0 0 15px #7c3aed11'

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 230, height: 230 }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Wide ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 230,
          height: 230,
          background: active
            ? `radial-gradient(circle, #00f5ff0a 0%, #7c3aed06 50%, transparent 70%)`
            : 'radial-gradient(circle, #7c3aed06 0%, transparent 70%)',
        }}
        animate={active ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Outer ring (200px) — clockwise */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          border: `1.5px solid ${active ? '#00f5ff33' : '#00f5ff11'}`,
          boxShadow: active ? '0 0 16px #00f5ff18' : 'none',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        {/* Outer orbit dot — top */}
        <div
          className="absolute rounded-full"
          style={{
            width: 12,
            height: 12,
            background: '#00f5ff',
            boxShadow: `0 0 12px #00f5ff, 0 0 24px #00f5ff66`,
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: active ? 1 : 0.3,
          }}
        />
        {/* Outer orbit dot — bottom */}
        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            background: '#7c3aed',
            boxShadow: '0 0 8px #7c3aed',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: active ? 0.8 : 0.2,
          }}
        />
      </motion.div>

      {/* Mid ring (156px) — counter-clockwise */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 156,
          height: 156,
          border: `1px solid ${active ? '#7c3aed44' : '#7c3aed18'}`,
          boxShadow: active ? '0 0 12px #7c3aed18' : 'none',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 10,
            height: 10,
            background: '#7c3aed',
            boxShadow: '0 0 10px #7c3aed',
            top: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: active ? 1 : 0.25,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 7,
            height: 7,
            background: '#f0abfc',
            boxShadow: '0 0 8px #f0abfc',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: active ? 0.9 : 0.2,
          }}
        />
      </motion.div>

      {/* Inner ring (118px) — clockwise, slow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 118,
          height: 118,
          border: `1px dashed ${active ? '#00f5ff22' : '#00f5ff08'}`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Hexagonal core shape */}
      <motion.div
        className="absolute"
        style={{
          width: 88,
          height: 88,
          background: active
            ? `linear-gradient(135deg, rgba(0,245,255,0.25) 0%, rgba(124,58,237,0.35) 100%)`
            : 'rgba(124,58,237,0.1)',
          clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
        }}
        animate={active
          ? { scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }
          : { scale: 1, opacity: 0.4 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: 96,
          height: 96,
          background: active
            ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, #00f5ff 30%, #7c3aed 80%, transparent 100%)`
            : `radial-gradient(circle at 35% 30%, rgba(200,200,200,0.4) 0%, #7c3aed44 60%, transparent 100%)`,
          boxShadow: coreGlow,
        }}
        animate={active
          ? { boxShadow: [
              `0 0 40px #00f5ff66, 0 0 80px #00f5ff22`,
              `0 0 ${60 + intensity * 40}px #00f5ff99, 0 0 120px #00f5ff44`,
              `0 0 40px #00f5ff66, 0 0 80px #00f5ff22`,
            ]}
          : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.span
          style={{ fontSize: 34, userSelect: 'none' }}
          animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ⚡
        </motion.span>
      </motion.div>

      {/* Floating ambient particles */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: active ? 1 : 0.2,
          }}
          animate={{
            y: [-6, 6, -6],
            x: [-2, 2, -2],
            opacity: active ? [0.2, 0.9, 0.2] : [0.05, 0.2, 0.05],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Hash power indicator ring segments */}
      {active && (
        <svg
          className="absolute"
          width={230}
          height={230}
          style={{ top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360
            const rad = (angle - 90) * (Math.PI / 180)
            const r = 112
            const cx = 115, cy = 115
            const x = cx + r * Math.cos(rad)
            const y = cy + r * Math.sin(rad)
            const isLit = i < Math.round((hashPower / 100) * 12)
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={2.5}
                fill={isLit ? '#00f5ff' : '#00f5ff18'}
                animate={isLit ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.12 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            )
          })}
        </svg>
      )}
    </motion.div>
  )
}
