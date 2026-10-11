import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { THINK_BONUS, THINK_COOLDOWN_MS } from '../config';
import { todayLocal } from '../services/api';
import MoodSelector from './MoodSelector';

/** Хук обратного отсчёта: сколько миллисекунд осталось до конца кулдауна */
function useCooldown(lastIso) {
  const calc = () => (lastIso ? Math.max(0, new Date(lastIso).getTime() + THINK_COOLDOWN_MS - Date.now()) : 0);
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    const timer = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastIso]);

  return left;
}

const formatTime = (ms) => {
  const total = Math.ceil(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export default function ActionPanel({ myRow, busy, onThink, onMood }) {
  const left = useCooldown(myRow?.last_think_at);
  const thinkDisabled = busy || left > 0;
  const bonusAvailable = myRow?.mood_bonus_date !== todayLocal();

  return (
    <section className="flex flex-col gap-5">
      <div>
        <motion.button
          type="button"
          disabled={thinkDisabled}
          whileTap={thinkDisabled ? undefined : { scale: 0.96 }}
          onClick={onThink}
          className={`w-full rounded-3xl py-5 flex items-center justify-center gap-3 text-lg font-semibold transition-all ${
            thinkDisabled
              ? 'bg-rose-100 text-rose-300 shadow-neu-in'
              : 'bg-gradient-to-br from-rose-400 to-orange-300 text-white shadow-xl'
          }`}
        >
          <Heart size={22} fill={thinkDisabled ? 'none' : 'currentColor'} />
          {left > 0 ? `Снова через ${formatTime(left)}` : 'Я думаю о тебе ❤️'}
        </motion.button>
        <p className="mt-2 text-center text-xs text-rose-700/60">+{THINK_BONUS} к здоровью · раз в час</p>
      </div>

      <MoodSelector
        value={myRow?.mood ?? null}
        bonusAvailable={bonusAvailable}
        disabled={busy}
        onSelect={onMood}
      />
    </section>
  );
}