import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  message: string | null
}

export default function Toast({ message }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 z-50 glass rounded-full px-6 py-3"
          style={{
            transform: 'translateX(-50%)',
            border: '1px solid #00f5ff44',
            boxShadow: '0 0 20px #00f5ff22',
            color: '#00f5ff',
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
