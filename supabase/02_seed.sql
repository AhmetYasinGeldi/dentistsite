-- =====================================================================
-- Başlangıç verisi (hayali klinik). 01_schema.sql'den sonra çalıştırın.
-- Hasta verisi eklenmez; testlerde sadece sahte bilgiler kullanılır.
-- =====================================================================

-- Klinik ayarları (isim ve numara sonra panelden güncellenebilir)
insert into public.clinic_settings (id, clinic_name, phone, whatsapp_number, address)
values (1, 'Klinik Adı', null, null, null);

-- Çalışma saatleri: hafta içi 09:00-18:00 (öğle arası 12:30-13:30),
-- cumartesi 09:00-14:00, pazar kapalı
insert into public.working_hours (day_of_week, is_open, open_time, close_time, break_start, break_end) values
  (1, true,  '09:00', '18:00', '12:30', '13:30'),
  (2, true,  '09:00', '18:00', '12:30', '13:30'),
  (3, true,  '09:00', '18:00', '12:30', '13:30'),
  (4, true,  '09:00', '18:00', '12:30', '13:30'),
  (5, true,  '09:00', '18:00', '12:30', '13:30'),
  (6, true,  '09:00', '14:00', null,    null),
  (7, false, null,    null,    null,    null);

-- Doktorlar
insert into public.doctors (title, full_name, specialty, sort_order) values
  ('Dt.',      'Elif Kaya',     'Genel Diş Hekimi',              1),
  ('Dt.',      'Murat Demir',   'Genel Diş Hekimi',              2),
  ('Uzm. Dt.', 'Zeynep Arslan', 'Ortodonti',                     3),
  ('Uzm. Dt.', 'Can Yıldız',    'Endodonti',                     4),
  ('Uzm. Dt.', 'Selin Aydın',   'Ağız, Diş ve Çene Cerrahisi',   5);

-- İşlemler ve süreleri (dakika)
insert into public.procedures (name, duration_minutes, sort_order) values
  ('Muayene',                  30,  1),
  ('Diş Taşı Temizliği',       45,  2),
  ('Dolgu',                    45,  3),
  ('Basit Diş Çekimi',         30,  4),
  ('Diş Beyazlatma',           60,  5),
  ('Kanal Tedavisi',           60,  6),
  ('Gömülü Diş Çekimi',        60,  7),
  ('İmplant',                  90,  8),
  ('Ortodonti Muayenesi',      30,  9),
  ('Tel/Plak Kontrolü',        30, 10);

-- Doktor - işlem eşleşmeleri
insert into public.doctor_procedures (doctor_id, procedure_id)
select d.id, p.id
from public.doctors d
join public.procedures p on
     (d.full_name in ('Elif Kaya', 'Murat Demir')
        and p.name in ('Muayene', 'Diş Taşı Temizliği', 'Dolgu', 'Basit Diş Çekimi', 'Diş Beyazlatma'))
  or (d.full_name = 'Zeynep Arslan'
        and p.name in ('Ortodonti Muayenesi', 'Tel/Plak Kontrolü'))
  or (d.full_name = 'Can Yıldız'
        and p.name in ('Muayene', 'Kanal Tedavisi'))
  or (d.full_name = 'Selin Aydın'
        and p.name in ('Muayene', 'Basit Diş Çekimi', 'Gömülü Diş Çekimi', 'İmplant'));
