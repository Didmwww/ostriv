import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, Clock, X } from 'lucide-react';
import { PHOTO_BONUS, PHOTO_PENALTY, USERS } from '../config';
import { gardenService, todayForPhotos } from '../services/api';
import Polaroid, { formatPhotoMoment } from './Polaroid';

/** Строка статуса: сделал ли человек фото сегодня */
function StatusRow({ name, done }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      {done ? <Check size={15} className="text-emerald-500" /> : <Clock size={15} className="text-rose-300" />}
      <span className={done ? 'text-rose-900' : 'text-rose-700/60'}>
        {name}: {done ? 'фото есть' : 'ещё нет'}
      </span>
    </span>
  );
}

/**
 * «Фото дня»: одно фото в сутки на каждого (+5% к шкале), пропуск дня — −10% здоровья.
 * Ниже — галерея всех снимков в виде полароидов.
 */
export default function PhotoDiary({ me, photos, busy, hasMore, onSubmit, onMore }) {
  const inputRef = useRef(null);
  const [opened, setOpened] = useState(null);

  const today = todayForPhotos();
  const partnerId = USERS[me].partner;
  const doneToday = (userId) => photos.some((p) => p.user_id === userId && p.photo_date === today);
  const myDone = doneToday(me);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы тот же файл можно было выбрать снова после ошибки
    if (file) await onSubmit(file);
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-3xl bg-rose-50 p-5 shadow-neu">
        <h3 className="mb-3 font-medium text-rose-900">Фото дня</h3>

        <div className="mb-4 flex flex-col gap-1.5">
          <StatusRow name="Ты" done={myDone} />
          <StatusRow name={USERS[partnerId].name} done={doneToday(partnerId)} />
        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <motion.button
          type="button"
          disabled={busy || myDone}
          whileTap={busy || myDone ? undefined : { scale: 0.96 }}
          onClick={() => inputRef.current?.click()}
          className={`flex w-full items-center justify-center gap-3 rounded-3xl py-4 text-base font-semibold transition-all ${
            busy || myDone
              ? 'bg-rose-100 text-rose-300 shadow-neu-in'
              : 'bg-gradient-to-br from-rose-400 to-orange-300 text-white shadow-xl'
          }`}
        >
          <Camera size={20} />
          {myDone ? 'Сегодняшнее фото уже добавлено' : `Добавить фото дня · +${PHOTO_BONUS}%`}
        </motion.button>

        <p className="mt-3 text-center text-xs text-rose-700/60">
          Одно фото в день, до 23:59. Не добавишь — растение потеряет {PHOTO_PENALTY}% здоровья
        </p>
      </div>

      {photos.length === 0 ? (
        <p className="px-4 text-center text-sm text-rose-700/60">
          Здесь появятся ваши снимки — по одному на каждый день 📷
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-1">
          {photos.map((photo, i) => (
            <Polaroid
              key={photo.id}
              photo={photo}
              src={gardenService.photoUrl(photo.path)}
              index={i}
              onOpen={setOpened}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onMore}
          className="mx-auto rounded-2xl bg-rose-50 px-6 py-2.5 text-sm text-rose-700 shadow-neu-sm"
        >
          Показать ещё
        </button>
      )}

      {/* Просмотр снимка крупно */}
      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpened(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/70 p-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -3 }}
              animate={{ scale: 1, rotate: -1.5 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[3px] bg-white p-3 pb-4 text-center shadow-2xl"
            >
              <img
                src={gardenService.photoUrl(opened.path)}
                alt=""
                className="max-h-[70dvh] w-full bg-rose-100 object-contain"
              />
              <p className="mt-3 font-handwritten text-xl leading-tight text-[#8a5a6e]">
                {USERS[opened.user_id]?.emoji} {formatPhotoMoment(opened.taken_at).day}
                <br />
                {formatPhotoMoment(opened.taken_at).time}
              </p>
            </motion.div>
            <button
              type="button"
              aria-label="Закрыть"
              className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] rounded-full bg-white/90 p-2 text-rose-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
