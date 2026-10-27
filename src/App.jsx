import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import {
  MOOD_BONUS,
  REFRESH_INTERVAL_MS,
  STORAGE_KEY,
  THINK_BONUS,
  THINK_COOLDOWN_MS,
  USERS,
} from './config';
import { gardenService, telegramNotifier } from './services/api';
import LoginScreen from './components/LoginScreen';
import PlantDisplay from './components/PlantDisplay';
import ActionPanel from './components/ActionPanel';
import SecretMessage from './components/SecretMessage';

export default function App() {
  // Кто сейчас за телефоном (dima | mashka), хранится в localStorage
  const [me, setMe] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return USERS[saved] ? saved : null;
  });
  const [garden, setGarden] = useState(null);
  const [moods, setMoods] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  /**
   * Загружает актуальное состояние сада и настроений.
   * getGarden() заодно просит сервер списать накопленное убывание,
   * а garden.health — единственный источник правды и для шкалы, и для вида растения.
   */
  const refresh = useCallback(async () => {
    try {
      const [g, m] = await Promise.all([gardenService.getGarden(), gardenService.getMoods()]);
      setGarden(g);
      setMoods(Object.fromEntries(m.map((row) => [row.user_id, row])));
      setError(null);
    } catch (e) {
      setError(e.message ?? 'Не удалось подключиться к Supabase');
    }
  }, []);

  // Первичная загрузка + realtime + обновление при возврате во вкладку
  useEffect(() => {
    if (!me) return undefined;
    refresh();
    const unsubscribe = gardenService.subscribe(refresh);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [me, refresh]);

  // Пока приложение открыто — раз в минуту пересчитываем убывание,
  // чтобы растение вяло прямо на глазах, без перезагрузки страницы
  useEffect(() => {
    if (!me) return undefined;
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [me, refresh]);

  const handleSelectUser = (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setMe(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMe(null);
    setGarden(null);
  };

  /** "Я думаю о тебе": +5%, активность, кулдаун, уведомление партнёру */
  const handleThink = async () => {
    const last = moods[me]?.last_think_at;
    if (last && new Date(last).getTime() + THINK_COOLDOWN_MS > Date.now()) return; // защита от двойного клика

    setBusy(true);
    try {
      await gardenService.registerActivity(me, THINK_BONUS, { think: true });
      await refresh();

      const sent = await telegramNotifier.notifyPartner(me, `${USERS[me].name} прямо сейчас думает о тебе! ❤️`);
      showToast(sent ? 'Сообщение улетело 💌' : 'Сад полит 🌱 (Telegram не ответил)');
    } catch (e) {
      showToast(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  /** Выбор настроения: активность + раз в сутки бонус +10% */
  const handleMood = async (value) => {
    setBusy(true);
    try {
      const { bonusGiven } = await gardenService.setMood(me, value, MOOD_BONUS);
      await refresh();
      showToast(bonusGiven ? `+${MOOD_BONUS}% к шкале 🌸` : 'Настроение обновлено');
    } catch (e) {
      showToast(`Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  /**
   * "Я хочу поговорить о…": только уведомление партнёру в Telegram.
   * Ни наград, ни влияния на шкалу и таймер убывания — активность не фиксируем.
   * @returns {Promise<boolean>} true, если сообщение доставлено (тогда поле очищается)
   */
  const handleTalk = async (topic) => {
    setBusy(true);
    try {
      const sent = await telegramNotifier.notifyPartner(
        me,
        `💬 ${USERS[me].name} хочет поговорить о ${topic}`,
      );
      showToast(sent ? 'Сообщение отправлено 💌' : 'Не удалось отправить в Telegram, попробуй ещё раз');
      return sent;
    } catch (e) {
      showToast(`Ошибка: ${e.message}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // --- Экран входа ---
  if (!me) return <LoginScreen onSelect={handleSelectUser} />;

  const partnerId = USERS[me].partner;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-rose-50 to-orange-50 text-rose-900">
      <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        {/* Шапка */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Наш сад</h1>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Сменить профиль"
            className="flex items-center gap-2 rounded-3xl bg-rose-50 shadow-neu-sm px-4 py-2 text-sm"
          >
            {USERS[me].emoji} {USERS[me].name}
            <LogOut size={14} />
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-3xl bg-rose-100 p-4 text-sm text-rose-700 shadow-neu-in">
            Не удалось загрузить сад: {error}
          </div>
        )}

        {!garden && !error && <p className="mt-20 text-center text-rose-700/60">Поливаем сад… 💧</p>}

        {garden && (
          <div className="flex flex-col gap-8">
            <PlantDisplay
              health={garden.health}
              totalPoints={garden.total_points}
              partnerId={partnerId}
              partnerMood={moods[partnerId]?.mood ?? null}
            />
            <ActionPanel myRow={moods[me]} busy={busy} onThink={handleThink} onMood={handleMood} onTalk={handleTalk} />
            <SecretMessage />
          </div>
        )}
      </div>

      {/* Всплывающее уведомление */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] mx-auto w-fit max-w-[90%] rounded-3xl bg-rose-900/90 px-6 py-3 text-sm text-white shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
