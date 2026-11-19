import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { RETURN_LABEL, RETURN_TARGET } from '../config';

const TARGET_MS = new Date(RETURN_TARGET).getTime();

/** Русское склонение: plural(1, ['день','дня','дней']) → 'день' */
function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** Раскладывает оставшиеся миллисекунды на дни / часы / минуты / секунды */
function splitTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n) => String(n).padStart(2, '0');

export default function ReturnTimer() {
  const [now, setNow] = useState(() => Date.now());

  // Тикаем раз в секунду; когда время вышло — таймер останавливается
  useEffect(() => {
    if (Date.now() >= TARGET_MS) return undefined;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= TARGET_MS) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const left = TARGET_MS - now;
  const finished = left <= 0;
  const { days, hours, minutes, seconds } = splitTime(left);

  const cells = [
    { value: String(days), unit: plural(days, ['день', 'дня', 'дней']) },
    { value: pad(hours), unit: plural(hours, ['час', 'часа', 'часов']) },
    { value: pad(minutes), unit: plural(minutes, ['минута', 'минуты', 'минут']) },
    { value: pad(seconds), unit: plural(seconds, ['секунда', 'секунды', 'секунд']) },
  ];

  return (
    <div className="w-full rounded-3xl bg-rose-50 shadow-neu p-5">
      <div className="flex items-center justify-center gap-2 mb-4 text-rose-900">
        <Clock size={16} className="text-rose-400" aria-hidden="true" />
        <h2 className="text-sm font-medium tracking-wide uppercase">{RETURN_LABEL}</h2>
      </div>

      {finished ? (
        <p className="text-center text-lg font-semibold text-rose-500">Время пришло ❤️</p>
      ) : (
        <div
          className="grid grid-cols-4 gap-2.5"
          role="timer"
          aria-label={`${RETURN_LABEL}: осталось ${days} ${plural(days, ['день', 'дня', 'дней'])}, ${hours} ч, ${minutes} мин, ${seconds} сек`}
        >
          {cells.map((cell) => (
            <div key={cell.unit} className="flex flex-col items-center rounded-2xl bg-rose-50 shadow-neu-sm py-3">
              <span className="text-2xl font-semibold tabular-nums text-rose-500 leading-none">{cell.value}</span>
              <span className="mt-1.5 text-[10px] text-rose-700/60">{cell.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
