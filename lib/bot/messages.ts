// lib/bot/messages.ts
// Botun tüm Türkçe metinleri bu dosyada. Metin değişirse sadece burası değişir.
// Adım isimleri (menu, ask_name, ...) lib/bot/steps.ts ile birebir aynıdır.
//
// Kurallar: "siz" dili, kısa, bir mesajda tek soru, en fazla 1 emoji.
// Limitler: buton başlığı en fazla 20, liste satırı en fazla 24,
// açıklama en fazla 72 karakter.
// Tarih biçimi: "5 Kasım 2026 Perşembe, 10:30". Bu biçimi çağıran taraf
// hazırlar, buradaki fonksiyonlara hazır metin olarak verilir.

// ---------- Ortak butonlar ----------
export const buttons = {
  book: "Randevu al",
  view: "Randevumu gör",
  cancelOrReschedule: "İptal / Ertele",
  confirm: "Onayla",
  change: "Değiştir",
  giveUp: "Vazgeç",
  cancel: "İptal et",
  reschedule: "Ertele",
  yesCancel: "Evet, iptal et",
  show: "Gör",
} as const;

// ---------- Liste satırları (en fazla 24 karakter) ----------
export const listRows = {
  otherDays: "Diğer günler",
  otherTimes: "Diğer saatler",
  morning: "Sabah",
  afternoon: "Öğleden sonra",
} as const;

// Liste mesajlarında listeyi açan butonun başlığı (en fazla 20 karakter)
export const listOpenButtons = {
  procedure: "İşlemleri gör",
  doctor: "Doktorları gör",
  date: "Günleri gör",
  time: "Saatleri gör",
} as const;

// ---------- Karşılama ----------
export const greeting =
  'Merhaba, diş kliniğimizin randevu asistanına hoş geldiniz 🦷 İstediğiniz zaman "menü" yazarak ana menüye dönebilirsiniz.';

// ---------- A) Randevu alma ----------
export const steps = {
  menu: "Size nasıl yardımcı olabilirim?",
  ask_name: "Adınızı ve soyadınızı yazar mısınız?",
  choose_procedure: "Hangi işlem için randevu almak istiyorsunuz?",
  choose_doctor: "Hangi doktorumuzu tercih edersiniz?",
  choose_date: "Hangi gün gelmek istersiniz?",
  choose_time: "Hangi saat size uygun?",
  choose_time_period: "Sabah mı, öğleden sonra mı tercih edersiniz?",

  // ---------- C) İptal / Ertele ----------
  manage_appointment: "Randevunuz için ne yapmak istersiniz?",
  confirm_cancel: "Randevunuzu iptal etmek istediğinize emin misiniz?",
  reschedule_date: "Yeni randevunuz için hangi gün uygun?",
  reschedule_time: "Hangi saati tercih edersiniz?",
} as const;

// confirm: özet + Onayla / Değiştir / Vazgeç
export const confirmSummary = (p: {
  procedure: string;
  doctor: string;
  dateTime: string;
}): string =>
  `Randevu özetiniz:\nİşlem: ${p.procedure}\nDoktor: ${p.doctor}\nTarih: ${p.dateTime}\n\nOnaylıyor musunuz?`;

export const requestReceived =
  "Talebiniz alındı, klinik onayladığında bilgilendirileceksiniz.";

// confirm_reschedule: Onayla / Vazgeç
export const confirmReschedule = (newDateTime: string): string =>
  `Randevunuz ${newDateTime} tarihine taşınacak. Onaylıyor musunuz?`;

export const rescheduleRequestReceived =
  "Erteleme talebiniz alındı, klinik onayladığında bilgilendirileceksiniz.";

export const cancelDone = "Randevunuz iptal edildi.";

// ---------- B) Randevumu gör (tek mesaj) ----------
export const appointmentInfo = (p: {
  dateTime: string;
  doctor: string;
  procedure: string;
  status: string;
}): string =>
  `Randevunuz:\nTarih: ${p.dateTime}\nDoktor: ${p.doctor}\nİşlem: ${p.procedure}\nDurum: ${p.status}`;

export const noActiveAppointment = "Aktif randevunuz bulunmuyor.";

// ---------- Panel bildirimleri ----------
export const notifications = {
  approved: (dateTime: string): string =>
    `Randevunuz onaylandı: ${dateTime}. Sizi bekliyoruz.`,
  rejected:
    'Üzgünüz, bu saat için randevunuz onaylanamadı. Yeni randevu için "menü" yazabilirsiniz.',
  clinicCancelled: (dateTime: string): string =>
    `Üzgünüz, ${dateTime} tarihli randevunuz klinik tarafından iptal edildi.`,
} as const;

// ---------- Hata ve özel durum mesajları ----------
export const errors = {
  notUnderstood: 'Anlayamadım, menüden seçer misiniz? "menü" yazarak menüye dönebilirsiniz.',
  hasActiveAppointment: "Zaten aktif bir randevunuz var. Ne yapmak istersiniz?",
  cancelDeadlinePassed: (clinicPhone: string): string =>
`Randevunuza az süre kaldığı için iptal veya erteleme işlemini buradan yapamıyoruz. Lütfen kliniği arayın: ${clinicPhone}`,  slotTaken: "Seçtiğiniz saat az önce doldu. Başka bir saat seçebilir misiniz?",
  noSlotsOnDate: "Bu gün için boş saat kalmadı. Başka bir gün seçebilir misiniz?",
  medicalOrPrice: (clinicPhone: string): string =>
    `Bu konuda en doğru bilgiyi kliniğimiz verebilir. Lütfen arayın: ${clinicPhone}`,
} as const;
