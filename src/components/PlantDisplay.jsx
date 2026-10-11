import { motion } from 'framer-motion';
import { MOODS, USERS, getLevelInfo } from '../config';

// Описание стадий растения: эмодзи, подпись, анимация и CSS-фильтр
const STAGES = {
  happy: {
    emoji: '🌳',
    label: 'Счастливо цветёт',
    animate: { scale: [1, 1.08, 1] }, // пульсация
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    className: '',
  },
  normal: {
    emoji: '🌿',
    label: 'Всё спокойно',
    animate: { rotate: [-2, 2, -2] }, // лёгкое покачивание
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    className: '',
  },
  weak: {
    emoji: '🌱',
    label: 'Ему нужна забота',
    animate: { x: [0, -3, 3, -3, 3, 0] }, // дрожание
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 1.5 },
    className: '',
  },
  dead: {
    emoji: '🥀',
    label: 'Завяло… спасите его вместе',
    animate: {},
    transition: {},
    className: 'grayscale opacity-70', // серая CSS-фильтрация
  },
};

const getStageKey = (health) => {
  if (health >= 80) return 'happy';
  if (health >= 40) return 'normal';
  if (health >= 1) return 'weak';
  return 'dead';
};

export default function PlantDisplay({ health, totalPoints, partnerId, partnerMood }) {
  const stageKey = getStageKey(health);
  const stage = STAGES[stageKey];
  const level = getLevelInfo(totalPoints);
  const mood = MOODS.find((m) => m.value === partnerMood);

  return (
    <section className="flex flex-col items-center gap-6">
      {/* Настроение партнёра */}
      <div className="flex items-center gap-3 rounded-3xl bg-rose-50 shadow-neu-sm px-5 py-2.5">
        <span className="text-sm text-rose-800/80">Настроение {USERS[partnerId].genitive}:</span>
        <span className="text-2xl leading-none">{mood ? mood.emoji : '🤍'}</span>
      </div>

      {/* Прогресс-бар здоровья и уровень */}
      <div className="w-full rounded-3xl bg-rose-50 shadow-neu p-5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm font-medium text-rose-900">
            Уровень {level.level} · {level.title}
          </span>
          <span className="text-lg font-semibold text-rose-500">{health}%</span>
        </div>
        <div
          className="h-4 rounded-full bg-rose-100 shadow-neu-in overflow-hidden"
          role="progressbar"
          aria-valuenow={health}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-300 to-orange-300"
            initial={false}
            animate={{ width: `${health}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
        <p className="mt-3 text-xs text-rose-700/60">До следующего уровня: {level.toNext} очк.</p>
      </div>

      {/* Растение */}
      <div className="w-60 h-60 rounded-full bg-rose-50 shadow-neu flex items-center justify-center">
        <motion.div
          key={stageKey} // сбрасываем анимацию при смене стадии
          animate={stage.animate}
          transition={stage.transition}
          className={`text-[7.5rem] leading-none ${stage.className}`}
        >
          {stage.emoji}
        </motion.div>
      </div>
      <p className="text-rose-800/80 font-medium">{stage.label}</p>
    </section>
  );
}