// ============================================================
// Конфигурация приложения. Секреты берутся из .env (Vite),
// если переменных нет — остаются заглушки.
// ============================================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;
export const DIMA_CHAT_ID = import.meta.env.VITE_DIMA_CHAT_ID;
export const MASHKA_CHAT_ID = import.meta.env.VITE_MASHKA_CHAT_ID;


// --- Игровые константы ---
export const STORAGE_KEY = 'garden:me';
export const THINK_BONUS = 5; // +здоровья за "Я думаю о тебе"
export const THINK_COOLDOWN_MS = 60 * 60 * 1000; // 1 час
export const MOOD_BONUS = 10; // +здоровья за настроение (раз в сутки)
export const HEALTH_DECAY_PER_HOUR = 1; // 1% здоровья уходит за каждый пропущенный час

// --- Участники ---
export const USERS = {
  dima: { id: 'dima', name: 'Дима', genitive: 'Димы', emoji: '🧑', chatId: DIMA_CHAT_ID, partner: 'mashka' },
  mashka: { id: 'mashka', name: 'Машка', genitive: 'Машки', emoji: '👩', chatId: MASHKA_CHAT_ID, partner: 'dima' },
};

// --- Настроение ---
export const MOODS = [
  { value: 1, emoji: '😢', label: 'Грустно' },
  { value: 2, emoji: '☁️', label: 'Пасмурно' },
  { value: 3, emoji: '😐', label: 'Нормально' },
  { value: 4, emoji: '☀️', label: 'Солнечно' },
  { value: 5, emoji: '🤩', label: 'Восторг' },
];

// --- Уровни отношений ---
// --- Уровни отношений ---
const LEVEL_THRESHOLDS = [0, 50, 100, 200, 400, 800, 1600];

const LEVEL_TITLES = [
  'Росток знакомства',  // Уровень 1 (от 0 очков)
  'Первое свидание',    // Уровень 2 (от 50 очков)
  'Тёплые чувства',     // Уровень 3 (от 100 очков)
  'Крепкая связь',      // Уровень 4 (от 200 очков)
  'Родные души',        // Уровень 5 (от 400 очков)
  'Вечная любовь',      // Уровень 6 (от 800 очков)
  'Космическая связь'   // Уровень 7 (от 1600 очков) — бонус для хардкора!
];

export function getLevelInfo(points = 0) {
  let level = 1;
  
  // Ищем максимальный порог, который вы уже преодолели
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  // Забираем соответствующее название
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  // Считаем, сколько очков осталось до следующего
  let toNext = 0;
  if (level < LEVEL_THRESHOLDS.length) {
    toNext = LEVEL_THRESHOLDS[level] - points;
  }

  return { level, title, toNext };
}

