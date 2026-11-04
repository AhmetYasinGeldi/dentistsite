-- Panel test verisini siler. Sadece telefonu 900000 ile başlayan sahte
-- hastaları ve onların randevularını etkiler; gerçek veriye dokunmaz.
begin;

delete from public.appointments
where patient_id in (select id from public.patients where phone like '900000%');

delete from public.patients
where phone like '900000%';

commit;
