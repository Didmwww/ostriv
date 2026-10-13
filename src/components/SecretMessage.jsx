import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

/** Тихое послание в самом низу страницы: полупрозрачное, с лёгким "дыханием" */
export default function SecretMessage() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.35, 0.65, 0.35] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="mt-2 flex flex-col items-center gap-2 text-center"
    >
      <Heart size={14} className="text-rose-400" fill="currentColor" aria-hidden="true" />
      <p className="text-xs italic tracking-wide text-rose-900/70">Я тебя очень сильно люблю, и скучаю</p>
    </motion.footer>
  );
}
