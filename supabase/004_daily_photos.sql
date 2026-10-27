-- =========================================================
-- Миграция: фото дня (галерея полароидов)
-- Выполнить в Supabase → SQL Editor ПОСЛЕ 003_decay_rate_2pct.sql
--
-- Правила:
--  • каждый из двоих может добавить ровно 1 фото в день (сутки по Киеву, 00:00–23:59);
--  • за фото: +5 к шкале (и очки уровня) через register_activity;
--  • за каждый день, в который фото не добавлено: −10% здоровья каждому, кто пропустил;
--  • штраф начисляется после окончания дня, автоматически и ровно один раз;
--    первый день штрафа — завтрашний (сегодня день-«грейс», штрафа за прошлое нет).
-- Скрипт можно запускать повторно.
-- =========================================================

-- 1. Таблица фото: сами картинки лежат в Storage, здесь только ссылки и даты
create table if not exists public.daily_photos (
  id         bigint generated always as identity primary key,
  user_id    text        not null,
  photo_date date        not null,                      -- день по Киеву, к которому относится фото
  path       text        not null,                      -- путь файла в бакете garden-photos
  taken_at   timestamptz not null default now(),
  constraint daily_photos_one_per_day unique (user_id, photo_date)
);

alter table public.daily_photos enable row level security;

drop policy if exists "daily_photos read" on public.daily_photos;
create policy "daily_photos read" on public.daily_photos
  for select to anon using (true);

-- вставка — только через функцию submit_photo (security definer), напрямую запрещена
grant select on public.daily_photos to anon;

-- 2. Realtime: чтобы фото партнёра появлялось в галерее без перезагрузки
do $$
begin
  alter publication supabase_realtime add table public.daily_photos;
exception
  when duplicate_object then null;  -- уже добавлена
  when undefined_object then null;  -- публикации нет (например, локальная проверка)
end
$$;

-- 3. Хранилище картинок (публичный бакет, только JPEG до 5 МБ)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garden-photos', 'garden-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg'];

drop policy if exists "garden photos upload" on storage.objects;
create policy "garden photos upload" on storage.objects
  for insert to anon with check (bucket_id = 'garden-photos');

-- 4. Учёт проверки штрафов: до какой даты (включительно) дни уже проверены
alter table public.user_moods
  add column if not exists photo_penalty_checked date not null
    default ((now() at time zone 'Europe/Kyiv')::date);

-- 5. Штраф: −10% за каждый прошедший день без фото. Идемпотентно и атомарно.
create or replace function public.apply_photo_penalty()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today       date := (now() at time zone 'Europe/Kyiv')::date;
  u           record;
  missed      int;
  penalty_pct constant int := 10;
begin
  -- та же блокировка строки сада, что и в apply_decay: два телефона не спишут штраф дважды
  perform 1 from public.garden_state where id = 1 for update;

  for u in
    select user_id, photo_penalty_checked
      from public.user_moods
     where photo_penalty_checked < today - 1
  loop
    -- завершённые дни после последней проверки: (checked + 1) .. (вчера)
    select count(*) into missed
      from generate_series(u.photo_penalty_checked + 1, today - 1, interval '1 day') as g(d)
     where not exists (
       select 1 from public.daily_photos p
        where p.user_id = u.user_id and p.photo_date = g.d::date
     );

    if missed > 0 then
      update public.garden_state
         set health     = greatest(0, health - missed * penalty_pct),
             updated_at = now()
       where id = 1;
    end if;

    update public.user_moods
       set photo_penalty_checked = today - 1
     where user_id = u.user_id;
  end loop;
end;
$$;

-- 6. apply_decay: прежняя логика (−2% за каждый полный час тишины после первого) + проверка штрафа за фото
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
  perform public.apply_photo_penalty();

  select * into g from public.garden_state where id = 1 for update;

  -- общая тишина = время с последней активности ЛЮБОГО из двоих
  select max(last_activity_at) into last_act from public.user_moods;
  if last_act is null then
    return g;
  end if;

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

-- 7. Добавление фото дня: одно в сутки, +5 к шкале
create or replace function public.submit_photo(p_user text, p_path text)
returns public.daily_photos
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Europe/Kyiv')::date;
  photo public.daily_photos;
  bonus constant int := 5;
begin
  if not exists (select 1 from public.user_moods where user_id = p_user) then
    raise exception 'Unknown user: %', p_user;
  end if;

  -- сначала фиксируем штрафы за прошедшие дни
  perform public.apply_photo_penalty();

  begin
    insert into public.daily_photos (user_id, photo_date, path)
    values (p_user, today, p_path)
    returning * into photo;
  exception
    when unique_violation then
      raise exception 'Фото за сегодня уже добавлено';
  end;

  perform public.register_activity(p_user, bonus);
  return photo;
end;
$$;

grant execute on function public.apply_photo_penalty() to anon;
grant execute on function public.apply_decay() to anon;
grant execute on function public.submit_photo(text, text) to anon;
