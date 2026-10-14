-- =========================================================
-- Миграция: убывание шкалы −2% за каждый полный час тишины (было −1%)
-- Выполнить в Supabase → SQL Editor. Заменяет функцию apply_decay из 002.
-- Новые колонки не нужны: decay_applied_hours по-прежнему считает ЧАСЫ,
-- а проценты получаются умножением на DECAY_PER_HOUR.
-- =========================================================

create or replace function public.apply_decay()
returns public.garden_state
language plpgsql
security definer
set search_path = public
as $$
declare
  g              public.garden_state;
  last_act       timestamptz;
  owed_hours     int;
  decay_per_hour constant int := 2;  -- % здоровья за каждый полный час тишины
begin
  select * into g from public.garden_state where id = 1 for update;

  -- общая тишина = время с последней активности ЛЮБОГО из двоих
  select max(last_activity_at) into last_act from public.user_moods;
  if last_act is null then
    return g;
  end if;

  -- первый час тишины — без потерь, затем считаем каждый полный час
  owed_hours := greatest(0, floor(extract(epoch from (now() - last_act)) / 3600)::int - 1);

  if owed_hours > g.decay_applied_hours then
    update public.garden_state
       set health              = greatest(0, health - (owed_hours - g.decay_applied_hours) * decay_per_hour),
           decay_applied_hours = owed_hours,
           updated_at          = now()
     where id = 1
     returning * into g;
  end if;

  return g;
end;
$$;

grant execute on function public.apply_decay() to anon;
