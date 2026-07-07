import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 py-2 mb-2">
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl" style={{ background: 'var(--arrow-bg-elevated)' }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--arrow-accent)' }}
            animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-xs self-center" style={{ color: 'var(--arrow-text-muted)' }}>
        escrevendo
      </span>
    </div>
  );
}
