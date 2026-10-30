export const messages = {
  // Karşılama ve ana menü
  welcome: "Merhaba, randevu asistanına hoş geldiniz. ✨",
  mainMenu: "Size nasıl yardımcı olabiliriz?",
  menuHint: "Ana menüye dönmek için istediğiniz zaman menü yazabilirsiniz.",

  // Randevu alma adımları
  askFullName: "Adınızı ve soyadınızı paylaşır mısınız?",
  invalidFullName: "Lütfen adınızı ve soyadınızı birlikte yazınız.",
  chooseProcedure: "Hangi işlem için randevu almak istersiniz?",
  chooseDoctor: "Hangi doktorumuzdan randevu almak istersiniz?",
  chooseDate: "Hangi tarihte gelmek istersiniz?",
  chooseTime: "Uygun saatlerden hangisini tercih edersiniz?",
  confirmBooking: "İşlem: [islem]\nDoktor: [doktor]\nTarih: [tarih]\nSaat: [saat]\n\nRandevu talebinizi onaylıyor musunuz?",
  chooseChange: "Hangi bilgiyi değiştirmek istersiniz?",
  requestReceived: "Talebiniz alındı. Klinik onayladığında bilgilendirileceksiniz. ⏳",
  bookingAbandoned: "Randevu oluşturma işleminden vazgeçtiniz.",

  // Randevu görüntüleme
  currentAppointment: "İşlem: [islem]\nDoktor: [doktor]\nTarih: [tarih]\nSaat: [saat]\nDurum: [durum] 📅",
  noActiveAppointment: "Aktif bir randevunuz bulunmuyor. 🔍",
  activeAppointmentExists: "Zaten aktif bir randevunuz var.",
  chooseAppointmentAction: "Randevunuz için hangi işlemi yapmak istersiniz?",

  // İptal ve erteleme
  confirmCancellation: "[tarih], [saat] için randevunuzu iptal etmek istediğinize emin misiniz?",
  appointmentCancelled: "Randevunuz iptal edildi. 🗑️",
  appointmentKept: "Randevunuz korunuyor. Herhangi bir değişiklik yapılmadı.",
  chooseRescheduleDate: "Randevunuzu hangi tarihe ertelemek istersiniz?",
  chooseRescheduleTime: "Yeni randevunuz için hangi saati tercih edersiniz?",
  confirmReschedule: "Yeni randevu talebiniz:\nİşlem: [islem]\nDoktor: [doktor]\nTarih: [tarih]\nSaat: [saat]\n\nBu değişikliği onaylıyor musunuz?",
  rescheduleReceived: "Eski randevunuz iptal edildi ve yeni talebiniz alındı. Klinik onayladığında bilgilendirileceksiniz. 🔄",
  rescheduleAbandoned: "Erteleme işleminden vazgeçtiniz. Mevcut randevunuz korunuyor.",
  cancellationLimitPassed: "Randevunuza kalan süre nedeniyle bot üzerinden iptal veya erteleme yapılamıyor. Lütfen kliniği arayınız. 📞",

  // Klinik işlemi tamamladıktan sonra gönderilecek bildirimler
  appointmentApproved: "[tarih], [saat] için [doktor] ile [islem] randevunuz onaylandı. ✅",
  appointmentRejected: "[tarih], [saat] için randevu talebiniz klinik tarafından reddedildi. Başka bir saat için yeni talep oluşturabilirsiniz. ❌",
  appointmentCancelledByClinic: "[tarih], [saat] için randevunuz klinik tarafından iptal edildi. Bilgi almak için lütfen kliniği arayınız. 📞",

  // Hata ve uygun seçenek bulunamaması
  slotTaken: "Bu saat az önce doldu, lütfen başka bir saat seçiniz. ⚠️",
  slotUnavailable: "Seçilen saat müsait değildir.",
  appointmentNotFound: "Randevu bulunamadı.",
  appointmentNotActive: "Bu randevu artık aktif değildir.",
  noProcedures: "Şu anda randevu alınabilecek bir işlem bulunmuyor. Lütfen kliniği arayınız.",
  noDoctors: "Bu işlem için şu anda uygun doktor bulunmuyor. Lütfen başka bir işlem seçiniz veya kliniği arayınız.",
  noSlotsOnDate: "Bu tarihte uygun saat bulunmuyor. Lütfen başka bir tarih seçiniz.",
  noSlotsInWindow: "Randevu alınabilecek tarihlerde uygun saat bulunmuyor. Lütfen kliniği arayınız.",
  bookingWindow: "Lütfen [ilkTarih] ile [sonTarih] arasındaki tarihlerden birini seçiniz.",
  invalidSelection: "Lütfen gösterilen seçeneklerden birini seçiniz.",
  invalidDate: "Lütfen geçerli bir tarih belirtiniz veya listeden bir tarih seçiniz.",
  invalidTime: "Lütfen listede gösterilen uygun saatlerden birini seçiniz.",
  notUnderstood: "Mesajınızı anlayamadım. Lütfen menüden bir seçenek seçiniz. 🤖",
  unsupportedMessage: "Bu mesaj türüyle işlem yapılamıyor. Lütfen metin yazınız veya menüden bir seçenek seçiniz.",
  serviceError: "Bir hata oluştu, lütfen tekrar deneyiniz.",
  contactClinic: "Lütfen kliniği arayınız: [telefon] 📞",
  medicalQuestion: "Tıbbi değerlendirme için lütfen kliniği arayınız: [telefon] 📞",
  priceQuestion: "Ücret bilgisi için lütfen kliniği arayınız: [telefon] 📞",
};

// Akışta her seferinde en fazla 3 buton gösterilecek.
export const buttons = {
  book: "Randevu al",
  view: "Randevumu gör",
  manage: "İptal / Ertele",
  confirm: "Onayla",
  change: "Değiştir",
  abandon: "Vazgeç",
  cancel: "İptal et",
  reschedule: "Ertele",
  menu: "Ana menü",
  confirmCancellation: "Evet, iptal et",
  keepAppointment: "Randevuyu koru",
};

export const listLabels = {
  procedures: "İşlem seç",
  doctors: "Doktor seç",
  dates: "Tarih seç",
  times: "Saat seç",
  moreDates: "Diğer tarihler",
  moreTimes: "Diğer saatler",
};
