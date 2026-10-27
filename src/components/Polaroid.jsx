import { motion } from 'framer-motion';
import { PHOTO_TZ, USERS } from '../config';

// Лёгкий наклон каждой карточки — зависит от id, поэтому не "прыгает" при обновлении
const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];
export const tiltFor = (id) => TILTS[Math.abs(Number(id) || 0) % TILTS.length];

/** "27 октября 2026" и "21:40" по киевскому времени */
export function formatPhotoMoment(iso) {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: PHOTO_TZ }),
    time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: PHOTO_TZ }),
  };
}

/** Один снимок в рамке полароида; вместо подписи — дата и время, когда он сделан */
export default function Polaroid({ photo, src, onOpen, index = 0 }) {
  const { day, time } = formatPhotoMoment(photo.taken_at);
  const author = USERS[photo.user_id];

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(photo)}
      aria-label={`Фото от ${day}, ${time}`}
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: tiltFor(photo.id) }}
      transition={{ delay: Math.min(index, 8) * 0.05, type: 'spring', stiffness: 160, damping: 18 }}
      whileTap={{ scale: 0.97, rotate: 0 }}
      className="block w-full rounded-[3px] bg-white p-2.5 pb-3 text-center shadow-[0_6px_18px_rgba(150,90,110,0.25)]"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-rose-100">
        <img src={src} alt="" loading="lazy" draggable="false" className="h-full w-full object-cover" />
      </div>
      <p className="mt-2.5 font-handwritten text-[17px] leading-[1.15] text-[#8a5a6e]">
        {author?.emoji} {day}
        <br />
        {time}
      </p>
    </motion.button>
  );
}
