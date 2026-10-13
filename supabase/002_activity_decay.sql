-- =========================================================
-- Миграция: учёт активности и убывание шкалы
-- Выполнить в Supabase → SQL Editor ДО выката нового фронтенда
-- =========================================================

-- 1. Новые колонки
alter table public.user_moods
  add column if not exists last_activity_at timestamptz not null default now();   -- lastActivityTimestamp каждого из пары

alter table public.garden_state
  add column if not exists decay_applied_hours int not null default 0 check (decay_applied_hours >= 0); -- сколько часов убывания уже списано в текущей тишине

-- 2. Убывание: первый час тишины — без потерь, затем −1% за каждый полный час.
--    Идемпотентно и атомарно (блокировка строки), безопасно при одновременных вызовах с двух телефонов.
create or replace function public.apply_decay()
returns public.garden_state
language plpgsql
security definer
set search_path = public
as $$
declare
  g          public.garden_state;
  last_act   timestamptz;
  owed_hours int;
begin
  select * into g from public.garden_state where id = 1 for update;

  -- общая тишина = время с последней активности ЛЮБОГО из двоих
  select max(last_activity_at) into last_act from public.user_moods;
  if last_act is null then
    return g;
  end if;

  owed_hours := greatest(0, floor(extract(epoch from (now() - last_act)) / 3600)::int - 1);

  if owed_hours > g.decay_applied_hours then
    update public.garden_state
       set health              = greatest(0, health - (owed_hours - g.decay_applied_hours)),
           decay_applied_hours = owed_hours,
           updated_at          = now()
     where id = 1
     returning * into g;
  end if;

  return g;
end;
$$;

-- 3. Активность: сначала фиксируем уже накопленное убывание, затем сбрасываем таймер и добавляем бонус (лимит 0..100).
create or replace function public.register_activity(
  p_user  text,
  p_delta int     default 0,
  p_think boolean default false
)
returns public.garden_state
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.garden_state;
begin
  perform public.apply_decay();

  update public.user_moods
     set last_activity_at = now(),
         last_think_at    = case when p_think then now() else last_think_at end,
         updated_at       = now()
   where user_id = p_user;

  if not found then
    raise exception 'Unknown user: %', p_user;
  end if;

  update public.garden_state
     set health              = greatest(0, least(100, health + p_delta)),
         total_points        = total_points + greatest(p_delta, 0),
         decay_applied_hours = 0,
         updated_at          = now()
   where id = 1
   returning * into g;

  return g;
end;
$$;

grant execute on function public.apply_decay() to anon;
grant execute on function public.register_activity(text, int, boolean) to anon;
