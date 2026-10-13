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
export const THINK_BONUS = 5; // +5% к шкале за "Я думаю о тебе"
export const THINK_COOLDOWN_MS = 60 * 60 * 1000; // 1 час
export const MOOD_BONUS = 10; // +10% к шкале за настроение (раз в сутки)
export const REFRESH_INTERVAL_MS = 60 * 1000; // как часто открытое приложение пересчитывает убывание

// Убывание (1 час тишины без потерь, затем −1% за каждый следующий час)
// считается на сервере в SQL-функции apply_decay — см. миграцию.

// --- Участники ---
export const USERS = {
  dima: { id: 'dima', name: 'Дима', genitive: 'Димы', emoji: '🧑', chatId: DIMA_CHAT_ID, partner: 'mashka' },
  mashka: { id: 'mashka', name: 'Машка', genitive: 'Машки', emoji: '👩', chatId: MASHKA_CHAT_ID, partner: 'dima' },
};

// --- Настроение ---
export const MOODS = [
  { value: 1, emoji: '😥', label: 'Грустно' },
  { value: 2, emoji: '😡', label: 'Злюсь' },
  { value: 3, emoji: '😐', label: 'Нормально' },
  { value: 4, emoji: '🙂', label: 'Хорошо' },
  { value: 5, emoji: '🤩', label: 'Восторг' },
];

// --- Уровни отношений ---
// Теперь это не абсолютные пороги, а "стоимость" каждого уровня
const LEVEL_COSTS = [0, 50, 100, 200, 400, 800, 1600];

const LEVEL_TITLES = [
  'Росток знакомства',  // Уровень 1 (сразу, 0 очков)
  'Первое свидание',    // Уровень 2 (чтобы перейти, нужно собрать 50 очков)
  'Тёплые чувства',     // Уровень 3 (чтобы перейти, нужно собрать 100 очков)
  'Крепкая связь',      // Уровень 4 (чтобы перейти, нужно собрать 200 очков)
  'Родные души',        // Уровень 5 (чтобы перейти, нужно собрать 400 очков)
  'Вечная любовь',      // Уровень 6 (чтобы перейти, нужно собрать 800 очков)
  'Космическая связь'   // Уровень 7 (чтобы перейти, нужно собрать 1600 очков)
];

export function getLevelInfo(points = 0) {
  let level = 1;
  let remainingPoints = points;

  // Проходим по массиву стоимостей, начиная со 2-го уровня (индекс 1),
  // так как 1-й уровень дается бесплатно
  for (let i = 1; i < LEVEL_COSTS.length; i++) {
    const costForNextLevel = LEVEL_COSTS[i];
    
    // Если накопленных очков хватает, чтобы "оплатить" переход на следующий уровень
    if (remainingPoints >= costForNextLevel) {
      remainingPoints -= costForNextLevel; // вычитаем потраченные очки
      level++;                             // повышаем уровень
    } else {
      // Если очков на следующий уровень не хватает, останавливаем цикл
      break;
    }
  }

  // Забираем соответствующее название
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  // Считаем, сколько очков осталось собрать ИМЕННО на текущем уровне до следующего
  let toNext = 0;
  if (level < LEVEL_COSTS.length) {
    toNext = LEVEL_COSTS[level] - remainingPoints;
  }

  return { level, title, toNext };
}

