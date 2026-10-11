import { motion } from 'framer-motion';
import { MOODS, MOOD_BONUS } from '../config';

export default function MoodSelector({ value, bonusAvailable, disabled, onSelect }) {
  return (
    <div className="rounded-3xl bg-rose-50 shadow-neu p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-medium text-rose-900">Как ты сегодня?</h3>
        <span className="text-xs text-rose-700/60">
          {bonusAvailable ? `+${MOOD_BONUS} к здоровью сегодня` : 'Бонус за сегодня получен'}
        </span>
      </div>

      <div className="flex gap-2.5">
        {MOODS.map((m) => {
          const active = m.value === value;
          return (
            <motion.button
              key={m.value}
              type="button"
              aria-label={m.label}
              disabled={disabled}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(m.value)}
              className={`flex-1 aspect-square rounded-2xl text-2xl flex items-center justify-center transition-shadow ${
                active ? 'bg-rose-100 shadow-neu-in' : 'bg-rose-50 shadow-neu-sm'
              } disabled:opacity-50`}
            >
              {m.emoji}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}