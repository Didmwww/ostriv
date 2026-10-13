import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  BOT_TOKEN,
  USERS,
} from '../config';


/** Сегодняшняя дата в локальном часовом поясе в формате YYYY-MM-DD */
export const todayLocal = () => new Date().toLocaleDateString('en-CA');

// ============================================================
// GardenService — всё общение с Supabase
// ============================================================
class GardenService {
  constructor(client) {
    this.db = client;
  }

  /**
   * Состояние сада. Перед чтением сервер (SQL-функция apply_decay) списывает
   * накопленное убывание за время общей тишины — один раз и атомарно,
   * поэтому два телефона не спишут проценты дважды.
   */
  async getGarden() {
    const { data, error } = await this.db.rpc('apply_decay');
    if (error) throw error;
    return data;
  }

  /** Настроения, время последней активности и последнего "думаю о тебе" обоих участников */
  async getMoods() {
    const { data, error } = await this.db.from('user_moods').select('*');
    if (error) throw error;
    return data;
  }

  /**
   * Фиксирует активность пользователя (SQL-функция register_activity):
   *  1) списывает убывание за уже прошедшую тишину,
   *  2) обновляет last_activity_at (и last_think_at для кнопки "думаю о тебе"),
   *  3) прибавляет delta процентов (лимит 0..100) и обнуляет счётчик убывания.
   * Возвращает новое состояние сада.
   */
  async registerActivity(userId, delta = 0, { think = false } = {}) {
    const { data, error } = await this.db.rpc('register_activity', {
      p_user: userId,
      p_delta: delta,
      p_think: think,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Сохраняет настроение. Любая смена настроения — это активность;
   * если сегодня бонус ещё не брали — дополнительно начисляет его.
   * @returns {Promise<{bonusGiven: boolean}>}
   */
  async setMood(userId, mood, bonusAmount) {
    const today = todayLocal();

    const { data: row, error: readError } = await this.db
      .from('user_moods')
      .select('mood_bonus_date')
      .eq('user_id', userId)
      .single();
    if (readError) throw readError;

    const bonusGiven = row.mood_bonus_date !== today;

    const { error } = await this.db
      .from('user_moods')
      .update({ mood, mood_bonus_date: today, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;

    await this.registerActivity(userId, bonusGiven ? bonusAmount : 0);
    return { bonusGiven };
  }

  /** Подписка на изменения в реальном времени. Возвращает функцию отписки. */
  subscribe(onChange) {
    const channel = this.db
      .channel(`garden-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garden_state' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_moods' }, onChange)
      .subscribe();
    return () => this.db.removeChannel(channel);
  }
}

// ============================================================
// TelegramNotifier — "невидимый почтальон"
// ============================================================
class TelegramNotifier {
  constructor(token) {
    this.token = token;
  }

  get isConfigured() {
    return Boolean(this.token) && !this.token.startsWith('YOUR_');
  }

  /** Отправляет сообщение в личку. Возвращает true/false, никогда не бросает исключение. */
  async send(chatId, text) {
    if (!this.isConfigured) {
      console.warn('[Telegram] BOT_TOKEN не настроен — сообщение не отправлено:', text);
      return false;
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return response.ok;
    } catch (err) {
      console.error('[Telegram] Ошибка отправки:', err);
      return false;
    }
  }

  /** Отправляет сообщение партнёру указанного пользователя */
  notifyPartner(fromUserId, text) {
    const partner = USERS[USERS[fromUserId].partner];
    return this.send(partner.chatId, text);
  }
}

// Единые экземпляры на всё приложение
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const gardenService = new GardenService(supabase);
export const telegramNotifier = new TelegramNotifier(BOT_TOKEN);
