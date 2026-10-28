-- =====================================================================
-- Diş Kliniği WhatsApp Randevu Sistemi — Veritabanı Şeması
-- Supabase SQL Editor'de bu dosyayı, ardından 02_seed.sql'i çalıştırın.
-- Tüm zamanlar timestamptz olarak tutulur; çalışma saatleri ise
-- klinik saat diliminde (Europe/Istanbul) yerel saat olarak yorumlanır.
-- =====================================================================

-- Aynı doktora çakışan randevu verilmesini veritabanı seviyesinde
-- engelleyen EXCLUDE kısıtı için gerekli.
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Ortak: updated_at alanını otomatik güncelleyen tetikleyici
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Klinik ayarları (tek satır)
-- ---------------------------------------------------------------------
create table public.clinic_settings (
  id                   smallint primary key default 1 check (id = 1),
  clinic_name          text not null,
  phone                text,
  whatsapp_number      text,          -- sitedeki wa.me butonu için, örn. 15551234567
  address              text,
  slot_minutes         smallint not null default 15
                         check (slot_minutes in (5, 10, 15, 20, 30)),
  cancel_limit_hours   smallint not null default 2
                         check (cancel_limit_hours >= 0),
  booking_window_days  smallint not null default 30
                         check (booking_window_days > 0),
  time_zone            text not null default 'Europe/Istanbul',
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) Doktorlar
-- ---------------------------------------------------------------------
create table public.doctors (
  id          bigint generated always as identity primary key,
  title       text not null default 'Dt.',      -- 'Dt.' veya 'Uzm. Dt.'
  full_name   text not null,
  specialty   text not null,                    -- 'Genel Diş Hekimi', 'Ortodonti' ...
  bio         text,
  photo_url   text,
  is_active   boolean not null default true,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) İşlemler (tedaviler) ve süreleri
-- ---------------------------------------------------------------------
create table public.procedures (
  id                bigint generated always as identity primary key,
  name              text not null unique,
  duration_minutes  smallint not null check (duration_minutes between 5 and 480),
  description       text,
  is_active         boolean not null default true,
  sort_order        smallint not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) Hangi doktor hangi işlemi yapabilir (çoka-çok)
-- ---------------------------------------------------------------------
create table public.doctor_procedures (
  doctor_id     bigint not null references public.doctors(id)    on delete cascade,
  procedure_id  bigint not null references public.procedures(id) on delete cascade,
  primary key (doctor_id, procedure_id)
);

-- ---------------------------------------------------------------------
-- 5) Haftalık çalışma saatleri (klinik geneli)
--    day_of_week ISO standardı: 1 = Pazartesi ... 7 = Pazar
-- ---------------------------------------------------------------------
create table public.working_hours (
  day_of_week  smallint primary key check (day_of_week between 1 and 7),
  is_open      boolean not null default true,
  open_time    time,
  close_time   time,
  break_start  time,
  break_end    time,
  check (not is_open or (open_time is not null and close_time is not null and open_time < close_time)),
  check ((break_start is null) = (break_end is null)),
  check (break_start is null or (break_start < break_end
                                 and break_start >= open_time
                                 and break_end   <= close_time))
);

-- ---------------------------------------------------------------------
-- 6) İzinler ve kapalı günler
--    doctor_id dolu  -> sadece o doktor müsait değil (izin, kongre ...)
--    doctor_id NULL  -> tüm klinik kapalı (resmi tatil vb.)
-- ---------------------------------------------------------------------
create table public.time_off (
  id          bigint generated always as identity primary key,
  doctor_id   bigint references public.doctors(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index time_off_range_idx on public.time_off (doctor_id, starts_at, ends_at);

-- ---------------------------------------------------------------------
-- 7) Hastalar
--    phone: WhatsApp'ın gönderdiği biçimde, + işareti olmadan (905321234567)
-- ---------------------------------------------------------------------
create table public.patients (
  id          bigint generated always as identity primary key,
  phone       text not null unique check (phone ~ '^[0-9]{10,15}$'),
  full_name   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8) Randevular
--    status:
--      pending   -> hasta talep etti, panel onayı bekleniyor (saat kilitli)
--      approved  -> klinik onayladı
--      rejected  -> klinik reddetti (saat serbest kalır)
--      cancelled -> hasta veya klinik iptal etti (saat serbest kalır)
--      completed -> randevu gerçekleşti
--    Erteleme: eski kayıt 'cancelled' olur, yeni kayıt 'pending' açılır ve
--    rescheduled_from alanı eski kaydı gösterir.
--    Panelden elle eklenen randevular source='admin', status='approved' açılır.
-- ---------------------------------------------------------------------
create table public.appointments (
  id                bigint generated always as identity primary key,
  patient_id        bigint not null references public.patients(id)   on delete restrict,
  doctor_id         bigint not null references public.doctors(id)    on delete restrict,
  procedure_id      bigint not null references public.procedures(id) on delete restrict,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  source            text not null default 'whatsapp'
                      check (source in ('whatsapp', 'admin')),
  patient_note      text,
  admin_note        text,
  rejection_reason  text,
  cancelled_by      text check (cancelled_by in ('patient', 'admin')),
  rescheduled_from  bigint references public.appointments(id) on delete set null,
  decided_at        timestamptz,     -- onay/red zamanı
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((status = 'cancelled') = (cancelled_by is not null)),
  -- Aynı doktorda, aktif (pending/approved) iki randevu zaman olarak çakışamaz.
  -- Aynı saate iki kişi aynı anda yazarsa ikinci INSERT 23P01 hatası alır.
  constraint appointments_no_overlap exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'approved'))
);
create index appointments_status_start_idx  on public.appointments (status, starts_at);
create index appointments_patient_start_idx on public.appointments (patient_id, starts_at);
create index appointments_doctor_start_idx  on public.appointments (doctor_id, starts_at);

-- ---------------------------------------------------------------------
-- 9) WhatsApp sohbet durumu (botun hastanın nerede kaldığını hatırlaması)
--    step    : sohbet adımı ('idle', 'ask_name', 'choose_procedure' ...)
--              adım isimlerini bot ekibi belirler.
--    context : o anki taslak seçimler, örn. {"procedure_id": 3, "doctor_id": 1}
--    last_inbound_at : hastanın son mesaj zamanı. 24 saatlik WhatsApp
--              penceresi bu alana göre kontrol edilir.
-- ---------------------------------------------------------------------
create table public.wa_sessions (
  phone            text primary key check (phone ~ '^[0-9]{10,15}$'),
  patient_id       bigint references public.patients(id) on delete set null,
  step             text not null default 'idle',
  context          jsonb not null default '{}'::jsonb,
  last_inbound_at  timestamptz,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10) WhatsApp mesaj kaydı
--    wa_message_id UNIQUE: Meta aynı webhook'u birden fazla gönderebilir;
--    aynı mesajın iki kez işlenmesini bu engeller.
-- ---------------------------------------------------------------------
create table public.wa_messages (
  id             bigint generated always as identity primary key,
  phone          text not null,
  direction      text not null check (direction in ('in', 'out')),
  wa_message_id  text unique,
  body           text,
  payload        jsonb,
  created_at     timestamptz not null default now()
);
create index wa_messages_phone_created_idx on public.wa_messages (phone, created_at desc);

-- ---------------------------------------------------------------------
-- updated_at tetikleyicileri
-- ---------------------------------------------------------------------
create trigger trg_clinic_settings_updated before update on public.clinic_settings
  for each row execute function public.set_updated_at();
create trigger trg_doctors_updated before update on public.doctors
  for each row execute function public.set_updated_at();
create trigger trg_procedures_updated before update on public.procedures
  for each row execute function public.set_updated_at();
create trigger trg_patients_updated before update on public.patients
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger trg_wa_sessions_updated before update on public.wa_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Kural: Bir hastanın aynı anda yalnızca bir aktif randevusu olabilir.
-- "Aktif" = durumu pending/approved ve henüz bitmemiş (ends_at > now()).
-- Geçmişte kalmış ama 'completed' işaretlenmemiş randevular engel olmaz.
-- İhlalde hata kodu RD001, mesaj PATIENT_HAS_ACTIVE_APPOINTMENT döner.
-- ---------------------------------------------------------------------
create or replace function public.enforce_single_active_appointment()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('pending', 'approved') and new.ends_at > now() then
    -- Aynı hasta için eşzamanlı iki isteğin birlikte geçmesini önler
    perform pg_advisory_xact_lock(new.patient_id);

    if exists (
      select 1 from public.appointments a
      where a.patient_id = new.patient_id
        and a.id <> new.id
        and a.status in ('pending', 'approved')
        and a.ends_at > now()
    ) then
      raise exception 'PATIENT_HAS_ACTIVE_APPOINTMENT'
        using errcode = 'RD001',
              hint = 'Hastanın bekleyen veya onaylı bir randevusu zaten var.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_appointments_single_active
  before insert or update of status, starts_at, ends_at, patient_id on public.appointments
  for each row execute function public.enforce_single_active_appointment();

-- ---------------------------------------------------------------------
-- Erteleme: eski randevuyu iptal edip yeni saate 'pending' talep açar.
-- İki adım tek işlemde yapılır; yeni saat doluysa eski randevu bozulmaz.
-- Kullanım (Supabase JS):
--   supabase.rpc('reschedule_appointment',
--     { p_appointment_id: 12, p_new_starts_at: '2026-11-05T10:30:00+03:00' })
-- Doktor ve işlem aynı kalır. Yeni randevunun id'sini döndürür.
-- Hatalar: APPOINTMENT_NOT_FOUND (RD002), APPOINTMENT_NOT_ACTIVE (RD003),
--          SLOT_NOT_AVAILABLE (RD004), eşzamanlı çakışmada 23P01.
-- ---------------------------------------------------------------------
create or replace function public.reschedule_appointment(
  p_appointment_id  bigint,
  p_new_starts_at   timestamptz,
  p_cancelled_by    text default 'patient'
)
returns bigint
language plpgsql
as $$
declare
  v_old       public.appointments%rowtype;
  v_duration  int;
  v_new_id    bigint;
begin
  select * into v_old
  from public.appointments
  where id = p_appointment_id
  for update;

  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'RD002';
  end if;

  if v_old.status not in ('pending', 'approved') or v_old.ends_at <= now() then
    raise exception 'APPOINTMENT_NOT_ACTIVE' using errcode = 'RD003';
  end if;

  select duration_minutes into v_duration
  from public.procedures where id = v_old.procedure_id;

  update public.appointments
     set status = 'cancelled', cancelled_by = p_cancelled_by
   where id = v_old.id;

  -- Yeni saat gerçekten müsait mi? (çalışma saati, öğle arası, izin kontrolü)
  if not exists (
    select 1
    from public.get_available_slots(
           v_old.doctor_id, v_old.procedure_id,
           (p_new_starts_at at time zone (select time_zone from public.clinic_settings where id = 1))::date
         ) s
    where s.slot_start = p_new_starts_at
  ) then
    raise exception 'SLOT_NOT_AVAILABLE' using errcode = 'RD004';
  end if;

  insert into public.appointments
    (patient_id, doctor_id, procedure_id, starts_at, ends_at,
     status, source, patient_note, rescheduled_from)
  values
    (v_old.patient_id, v_old.doctor_id, v_old.procedure_id,
     p_new_starts_at, p_new_starts_at + make_interval(mins => v_duration),
     'pending', v_old.source, v_old.patient_note, v_old.id)
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Müsait saatleri hesaplayan fonksiyon
-- Kullanım (Supabase JS):
--   supabase.rpc('get_available_slots',
--     { p_doctor_id: 1, p_procedure_id: 3, p_date: '2026-11-05' })
-- Döner: slot_start, slot_end (timestamptz). Doktor o işlemi yapmıyorsa,
-- gün kapalıysa veya tarih rezervasyon aralığı dışındaysa boş döner.
-- ---------------------------------------------------------------------
create or replace function public.get_available_slots(
  p_doctor_id     bigint,
  p_procedure_id  bigint,
  p_date          date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
as $$
declare
  v_tz        text;
  v_slot      int;
  v_window    int;
  v_duration  int;
  v_today     date;
  v_wh        public.working_hours%rowtype;
  v_day_start timestamptz;
  v_day_end   timestamptz;
  v_brk_start timestamptz;
  v_brk_end   timestamptz;
begin
  select cs.time_zone, cs.slot_minutes, cs.booking_window_days
    into v_tz, v_slot, v_window
  from public.clinic_settings cs
  where cs.id = 1;

  if v_tz is null then
    return;
  end if;

  -- Doktor aktif mi, işlem aktif mi, doktor bu işlemi yapıyor mu?
  select p.duration_minutes
    into v_duration
  from public.procedures p
  join public.doctor_procedures dp on dp.procedure_id = p.id
  join public.doctors d            on d.id = dp.doctor_id
  where p.id = p_procedure_id
    and d.id = p_doctor_id
    and p.is_active
    and d.is_active;

  if v_duration is null then
    return;
  end if;

  -- Rezervasyon aralığı: bugünden itibaren booking_window_days gün
  v_today := (now() at time zone v_tz)::date;
  if p_date < v_today or p_date > v_today + v_window then
    return;
  end if;

  select * into v_wh
  from public.working_hours wh
  where wh.day_of_week = extract(isodow from p_date)::smallint;

  if not found or not v_wh.is_open then
    return;
  end if;

  v_day_start := (p_date + v_wh.open_time)  at time zone v_tz;
  v_day_end   := (p_date + v_wh.close_time) at time zone v_tz;
  if v_wh.break_start is not null then
    v_brk_start := (p_date + v_wh.break_start) at time zone v_tz;
    v_brk_end   := (p_date + v_wh.break_end)   at time zone v_tz;
  end if;

  return query
  with candidates as (
    select gs                                         as s,
           gs + make_interval(mins => v_duration)     as e
    from generate_series(
           v_day_start,
           v_day_end - make_interval(mins => v_duration),
           make_interval(mins => v_slot)
         ) as gs
  )
  select c.s, c.e
  from candidates c
  where c.s > now()
    -- öğle arasına denk gelmesin
    and (v_brk_start is null
         or not tstzrange(c.s, c.e, '[)') && tstzrange(v_brk_start, v_brk_end, '[)'))
    -- doktorun aktif randevusuyla çakışmasın
    and not exists (
      select 1 from public.appointments a
      where a.doctor_id = p_doctor_id
        and a.status in ('pending', 'approved')
        and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(c.s, c.e, '[)')
    )
    -- doktor izni veya klinik tatiliyle çakışmasın
    and not exists (
      select 1 from public.time_off t
      where (t.doctor_id = p_doctor_id or t.doctor_id is null)
        and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(c.s, c.e, '[)')
    )
  order by c.s;
end;
$$;

-- =====================================================================
-- Row Level Security
--   * Bot (Next.js API route) SERVICE_ROLE anahtarıyla bağlanır ve RLS'i
--     atlar. Bu anahtar sadece sunucuda kullanılır, asla tarayıcıya gitmez.
--   * Admin paneli Supabase Auth ile giriş yapan tek kullanıcıdır
--     (authenticated) ve tüm tablolara erişir.
--     ÖNEMLİ: Supabase Auth ayarlarından yeni kayıtları (sign up) kapatın,
--     yoksa kayıt olan herkes "authenticated" olur ve panele erişir.
--   * Kliniğin tanıtım sitesi (anon) sadece herkese açık bilgileri okur.
-- =====================================================================
alter table public.clinic_settings   enable row level security;
alter table public.doctors           enable row level security;
alter table public.procedures        enable row level security;
alter table public.doctor_procedures enable row level security;
alter table public.working_hours     enable row level security;
alter table public.time_off          enable row level security;
alter table public.patients          enable row level security;
alter table public.appointments      enable row level security;
alter table public.wa_sessions       enable row level security;
alter table public.wa_messages       enable row level security;

-- Admin: her şeye tam erişim
create policy admin_all on public.clinic_settings   for all to authenticated using (true) with check (true);
create policy admin_all on public.doctors           for all to authenticated using (true) with check (true);
create policy admin_all on public.procedures        for all to authenticated using (true) with check (true);
create policy admin_all on public.doctor_procedures for all to authenticated using (true) with check (true);
create policy admin_all on public.working_hours     for all to authenticated using (true) with check (true);
create policy admin_all on public.time_off          for all to authenticated using (true) with check (true);
create policy admin_all on public.patients          for all to authenticated using (true) with check (true);
create policy admin_all on public.appointments      for all to authenticated using (true) with check (true);
create policy admin_all on public.wa_sessions       for all to authenticated using (true) with check (true);
create policy admin_all on public.wa_messages       for all to authenticated using (true) with check (true);

-- Tanıtım sitesi: sadece okuma, sadece aktif kayıtlar
create policy public_read on public.clinic_settings   for select to anon using (true);
create policy public_read on public.doctors           for select to anon using (is_active);
create policy public_read on public.procedures        for select to anon using (is_active);
create policy public_read on public.doctor_procedures for select to anon using (true);
create policy public_read on public.working_hours     for select to anon using (true);
