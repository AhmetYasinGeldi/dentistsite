-- =====================================================================
-- Panel testleri için sahte hasta ve randevu verisi (tasks.md 27, PR #25)
-- Supabase SQL Editor'de tek seferde çalıştırın. Şemaya dokunmaz, sadece INSERT.
--
-- Tüm hastalar sahtedir: isim "Test Hasta 001" biçiminde, telefon
-- 900000000001 ... 900000000120 (90'dan sonra 000, gerçek bir hat olamaz).
-- Bu hastalar için wa_sessions kaydı açılmaz; panelden onay/red/iptal
-- denendiğinde notifyAppointmentUpdate WINDOW_CLOSED döner ve kimseye
-- WhatsApp mesajı gitmez.
--
-- Tarihler çalıştırıldığı güne göre (İstanbul) hesaplanır:
--   completed : 110 kayıt, dün ile 110 gün önce arası   -> 100 kayıt uyarısı
--   cancelled :  25 kayıt (22 geçmiş + 3 gelecek), hasta/admin karışık
--   rejected  :  15 kayıt, geçmiş, bazılarında red sebebi var
--   approved  :   5 geçmiş (tamamlandı işaretlenmemiş) + 3 gelecek
--   pending   :   5 gelecek (onayla/reddet/iptal butonlarını denemek için)
--
-- Test bitince supabase/test/panel-test-data-cleanup.sql ile silin.
-- =====================================================================

begin;

-- Tekrar çalıştırılırsa durdur (aktif randevu kuralı RD001'e takılmasın)
do $$
begin
  if exists (select 1 from public.patients where phone like '900000%') then
    raise exception 'Test verisi zaten yüklü. Önce temizleme betiğini çalıştırın.';
  end if;
end $$;

-- 1) 120 sahte hasta
insert into public.patients (phone, full_name)
select '900000' || lpad(g::text, 6, '0'),
       'Test Hasta ' || lpad(g::text, 3, '0')
from generate_series(1, 120) as g;

-- 2) Randevular
with
today as (
  select (now() at time zone 'Europe/Istanbul')::date as d
),
-- Doktorun gerçekten yaptığı işlemler (seed'deki doctor_procedures)
pairs as (
  select dp.doctor_id,
         dp.procedure_id,
         p.duration_minutes,
         row_number() over (order by dp.doctor_id, dp.procedure_id) - 1 as rn,
         count(*) over () as total
  from public.doctor_procedures dp
  join public.procedures p on p.id = dp.procedure_id
  join public.doctors d    on d.id = dp.doctor_id
  where p.is_active and d.is_active
),
plan (patient_no, day_offset, slot_time, status, cancelled_by, rejection_reason, source) as (
  -- Tamamlandı: 110 kayıt, her biri farklı gün/saat (sıralama kontrolü için)
  select g, -g,
         time '09:00' + make_interval(mins => 30 * (g % 16)),
         'completed', null::text, null::text,
         case when g % 3 = 0 then 'admin' else 'whatsapp' end
  from generate_series(1, 110) as g

  union all
  -- İptal edildi: 22 geçmiş + 3 gelecek (gelecektekiler listede en üstte olmalı)
  select g,
         case when g <= 22 then -2 * g else 15 + g end,
         time '10:00' + make_interval(mins => 45 * (g % 8)),
         'cancelled',
         case when g % 2 = 0 then 'admin' else 'patient' end,
         null,
         'whatsapp'
  from generate_series(1, 25) as g

  union all
  -- Reddedildi: 15 geçmiş kayıt, üçte birinde sebep yok
  select 25 + g, -3 * g,
         time '11:00' + make_interval(mins => 30 * (g % 10)),
         'rejected', null,
         case when g % 3 = 0 then null
              else (array['Doktor o gün izinli.',
                          'Bu işlem için önce muayene gerekiyor.'])[1 + g % 2]
         end,
         'whatsapp'
  from generate_series(1, 15) as g

  union all
  -- Onaylandı (geçmiş, tamamlandı işaretlenmemiş): 5 kayıt
  select 40 + g, -g,
         time '15:00' + make_interval(mins => 30 * g),
         'approved', null, null, 'admin'
  from generate_series(1, 5) as g

  union all
  -- Onay bekliyor (gelecek): 5 kayıt, hepsi farklı hasta
  select 110 + g, 6 + g,
         time '09:00' + make_interval(hours => g),
         'pending', null, null, 'whatsapp'
  from generate_series(1, 5) as g

  union all
  -- Onaylandı (gelecek): 3 kayıt, hepsi farklı hasta
  select 115 + g, 11 + g,
         time '15:30' + make_interval(mins => 30 * g),
         'approved', null, null, 'admin'
  from generate_series(1, 3) as g
)
insert into public.appointments (
  patient_id, doctor_id, procedure_id, starts_at, ends_at,
  status, source, rejection_reason, cancelled_by, decided_at, created_at
)
select pt.id,
       pr.doctor_id,
       pr.procedure_id,
       s.starts_at,
       s.starts_at + make_interval(mins => pr.duration_minutes),
       pl.status,
       pl.source,
       pl.rejection_reason,
       pl.cancelled_by,
       case when pl.status in ('approved', 'rejected', 'completed')
            then least(now(), s.starts_at - interval '2 days') end,
       least(now(), s.starts_at - interval '3 days')
from plan pl
cross join today t
join public.patients pt on pt.phone = '900000' || lpad(pl.patient_no::text, 6, '0')
join pairs pr on pr.rn = pl.patient_no % pr.total
cross join lateral (
  select (
    -- Gelecekteki randevu pazara denk gelirse pazartesiye kaydır
    case when pl.day_offset > 0 and extract(isodow from t.d + pl.day_offset) = 7
         then t.d + pl.day_offset + 1
         else t.d + pl.day_offset
    end + pl.slot_time
  ) at time zone 'Europe/Istanbul' as starts_at
) s
-- Gelecekteki pending/approved kayıt, veritabanındaki mevcut bir randevuyla
-- aynı doktorda çakışırsa sadece o satır atlanır (23P01 yerine).
on conflict do nothing;

commit;

-- 3) Kontrol: beklenen sayılar completed 110, cancelled 25, rejected 15,
--    approved 8, pending 5 (çakışma olduysa approved/pending biraz eksik olabilir)
select a.status, count(*) as adet, min(a.starts_at) as en_eski, max(a.starts_at) as en_yeni
from public.appointments a
join public.patients p on p.id = a.patient_id
where p.phone like '900000%'
group by a.status
order by a.status;
