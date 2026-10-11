import { motion } from 'framer-motion';
import { USERS } from '../config';

export default function LoginScreen({ onSelect }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-10 px-6 bg-gradient-to-b from-rose-50 to-orange-50">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-4"
        >
          🌱
        </motion.div>
        <h1 className="text-3xl font-semibold tracking-tight text-rose-900">Наш сад</h1>
        <p className="mt-2 text-rose-700/70">Кто ты сегодня?</p>
      </motion.div>

      <div className="w-full max-w-sm flex flex-col gap-5">
        {Object.values(USERS).map((user, i) => (
          <motion.button
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(user.id)}
            className="w-full rounded-3xl bg-rose-50 shadow-neu py-5 text-xl font-medium text-rose-900"
          >
            {user.emoji} Я {user.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}