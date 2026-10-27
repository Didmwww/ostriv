import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { TALK_MAX_LENGTH } from '../config';

/**
 * Блок "Мне нужно поговорить": начало фразы фиксировано ("Я хочу поговорить о…"),
 * человек дописывает тему и отправляет её партнёру в Telegram.
 * Это просто оповещение о серьёзном — без наград и без влияния на шкалу.
 */
export default function TalkRequest({ disabled, onSend }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const canSend = !disabled && trimmed.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    const ok = await onSend(trimmed);
    if (ok) setText(''); // при ошибке оставляем текст, чтобы не набирать заново
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-rose-50 shadow-neu p-5">
      <h3 className="mb-3 font-medium text-rose-900">Есть важный разговор</h3>

      <div className="rounded-2xl bg-rose-50 shadow-neu-in px-4 py-3">
        <span className="text-sm font-medium text-rose-700">Я хочу поговорить о</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TALK_MAX_LENGTH}
          rows={3}
          disabled={disabled}
          placeholder="…допиши, о чём"
          className="mt-1 block w-full resize-none bg-transparent text-base text-rose-900 placeholder:text-rose-300 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-rose-700/60">
          {text.length}/{TALK_MAX_LENGTH} · без наград, просто оповещение
        </span>
        <motion.button
          type="submit"
          disabled={!canSend}
          whileTap={canSend ? { scale: 0.95 } : undefined}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${
            canSend
              ? 'bg-gradient-to-br from-rose-400 to-orange-300 text-white shadow-lg'
              : 'bg-rose-100 text-rose-300 shadow-neu-in'
          }`}
        >
          <Send size={16} />
          Отправить
        </motion.button>
      </div>
    </form>
  );
}
