// ============================================================
// Конфигурация приложения. Секреты берутся из .env (Vite),
// если переменных нет — остаются заглушки.
// ============================================================

export const SUPABASE_URL = 'https://koptwbluifebhneeewls.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvcHR3Ymx1aWZlYmhuZWVld2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzEyNzgsImV4cCI6MjEwNzMwNzI3OH0.bp7n8Kb2N1JGHI_X79kbtlgweO2OO8RxfRa1RJvpAGo';
// --- Telegram (заглушки) ---
export const BOT_TOKEN = '8872383561:AAFm_j5wBibk3fjqq6cjfi3enV6--nLToI4';
export const DIMA_CHAT_ID = '921322125';
export const MASHKA_CHAT_ID = '840206126';

// --- Игровые константы ---
export const STORAGE_KEY = 'garden:me';
export const THINK_BONUS = 5; // +здоровья за "Я думаю о тебе"
export const THINK_COOLDOWN_MS = 60 * 60 * 1000; // 1 час
export const MOOD_BONUS = 10; // +здоровья за настроение (раз в сутки)
export const POINTS_PER_LEVEL = 50;

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
const LEVEL_TITLES = [
  'Росток знакомства',
  'Первое свидание',
  'Тёплые чувства',
  'Крепкая связь',
  'Родные души',
  'Вечная любовь',
];

export function getLevelInfo(points = 0) {
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  const toNext = POINTS_PER_LEVEL - (points % POINTS_PER_LEVEL);
  return { level, title, toNext };
}