import "server-only";

import { understandMessage } from "@/lib/ai/gemini";
import * as text from "@/lib/bot/messages";
import {
  cancelAppointment,
  createAppointment,
  createPatient,
  getActiveAppointment,
  getAvailableSlots,
  getBookableProcedures,
  getClinicSettings,
  getDoctor,
  getDoctorsForProcedure,
  getOpenWeekdays,
  getPatientByPhone,
  getProcedure,
  rescheduleAppointment,
  type ActiveAppointment,
} from "@/lib/bot/queries";
import {
  canPatientChange,
  nextDays,
  normalizeFullName,
  splitByPeriod,
  upcomingOpenDates,
  type TimePeriod,
} from "@/lib/bot/schedule";
import {
  getSession,
  resetSession,
  sessionContextSchema,
  setSession,
  type Session,
  type SessionContext,
} from "@/lib/bot/session";
import type { Step } from "@/lib/bot/steps";
import { getAppointmentStatusLabel } from "@/lib/shared/appointment-status";
import {
  formatDate,
  formatDateTime,
  formatTime,
  istanbulLocalToIso,
  todayInIstanbul,
} from "@/lib/shared/datetime";
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from "@/lib/shared/errors";
import { formatPhone, normalizePhone } from "@/lib/shared/phone";
import { paginateRows, parseMoreRowId, type ListRow } from "@/lib/whatsapp/interactive";
import { getReplyId, type IncomingMessage } from "@/lib/whatsapp/payload";
import { sendButtons, sendList, sendText } from "@/lib/whatsapp/send";

// Sohbet akışı (AGENTS.md 8. bölüm). Her gelen mesaj, oturumdaki adıma göre
// işlenir; her adımın mesajını gönderen "show" fonksiyonu adımı da kaydeder.
// Buton ve liste satırlarının id'leri "<tür>:<değer>" biçimindedir.
//
// Tarih/saat seçimi randevu almada ve ertelemede ortaktır: oturumda
// appointmentId varsa erteleme modundayız (adım adları ve soru metinleri değişir).

const MENU_WORDS = ["menü", "menu", "ana menü", "anamenü"];
const SLOT_PREFIX = "slot:";

// TODO(Ebru): İşlem/doktor listesi 10'u geçerse kullanılacak satır başlığı;
// messages.ts'e eklenince oradan alınacak (tasks.md 32).
const MORE_OPTIONS_TITLE = "Diğer seçenekler";

type Mode = "book" | "reschedule";

const MODE_STEPS = {
  book: { date: "choose_date", period: "choose_time_period", time: "choose_time" },
  reschedule: {
    date: "reschedule_date",
    period: "reschedule_time_period",
    time: "reschedule_time",
  },
} as const satisfies Record<Mode, Record<"date" | "period" | "time", Step>>;

const MODE_TEXT = {
  book: { date: text.steps.choose_date, time: text.steps.choose_time },
  reschedule: { date: text.steps.reschedule_date, time: text.steps.reschedule_time },
} as const;

function modeOf(context: SessionContext): Mode {
  return context.appointmentId ? "reschedule" : "book";
}

/** Webhook'tan çağrılan giriş noktası. Hata fırlatmaz. */
export async function handleIncoming(message: IncomingMessage): Promise<void> {
  try {
    await route(message);
  } catch (error) {
    console.error("[bot/flow] Akış hatası:", error);
    await sendText(message.from, DEFAULT_ERROR_MESSAGE);
  }
}

async function route(message: IncomingMessage): Promise<void> {
  const phone = message.from;
  const typed = message.text?.body.trim() ?? "";
  const replyId = getReplyId(message);

  // "menü" her adımdan ana menüye döner; menü butonları her adımda geçerlidir.
  if (MENU_WORDS.includes(typed.toLocaleLowerCase("tr"))) return showMenu(phone);
  if (replyId?.startsWith("menu:")) return handleMenuChoice(phone, replyId);

  const session = await getSession(phone);
  switch (session.step) {
    case "idle":
      if (typed) return handleFreeText(phone, typed, true);
      await sendText(phone, text.greeting);
      return showMenu(phone);
    case "menu":
      if (typed) return handleFreeText(phone, typed, false);
      return notUnderstood(phone, session);
    case "ask_name":
      return handleName(phone, session, typed);
    case "choose_procedure":
      return handleProcedure(phone, session, replyId);
    case "choose_doctor":
      return handleDoctor(phone, session, replyId);
    case "choose_date":
    case "reschedule_date":
      return handleDate(phone, session, replyId);
    case "choose_time_period":
    case "reschedule_time_period":
      return handlePeriod(phone, session, replyId);
    case "choose_time":
    case "reschedule_time":
      return handleTime(phone, session, replyId);
    case "confirm":
      return handleConfirm(phone, session, replyId);
    case "manage_appointment":
      return handleManage(phone, session, replyId);
    case "confirm_cancel":
      return handleCancelConfirm(phone, session, replyId);
    case "confirm_reschedule":
      return handleRescheduleConfirm(phone, session, replyId);
    default:
      return notUnderstood(phone, session);
  }
}

/** Anlaşılmayan cevap: uyarı ve o adımın sorusunu tekrar gönder. */
async function notUnderstood(phone: string, session: Session): Promise<void> {
  await sendText(phone, text.errors.notUnderstood);
  const c = session.context;
  switch (session.step) {
    case "ask_name":
      return askName(phone, hintsOf(c));
    case "choose_procedure":
      return showProcedures(phone, c);
    case "choose_doctor":
      return showDoctors(phone, c);
    case "choose_date":
    case "reschedule_date":
      return showDates(phone, c);
    case "choose_time_period":
    case "reschedule_time_period":
      return showPeriods(phone, c);
    case "choose_time":
    case "reschedule_time":
      return showTimes(phone, c);
    case "confirm":
      return showSummary(phone, c);
    case "manage_appointment":
    case "confirm_cancel":
    case "confirm_reschedule":
      return showManage(phone);
    default:
      return showMenu(phone);
  }
}

/** Taslak eksik/bozuksa baştan al: ertelemedeysek menüye, değilsek işlem listesine. */
function restart(phone: string, context: SessionContext): Promise<void> {
  return context.appointmentId ? showMenu(phone) : showProcedures(phone, {});
}

// ---------- Serbest metin (Gemini) ----------

/** Gemini'den gelen ipuçları: işlem, gün ve gün dilimi. */
type Hints = Pick<SessionContext, "procedureId" | "hintDate" | "hintPeriod">;

/** Sadece ipucu alanlarını al (oturumdan taşınırken). */
function hintsOf({ procedureId, hintDate, hintPeriod }: SessionContext): Hints {
  return { procedureId, hintDate, hintPeriod };
}

/**
 * Menüdeyken veya ilk mesajda butona basmak yerine yazı yazıldıysa Gemini
 * mesajı yapılandırılmış veriye çevirir; kararı her zaman kod verir.
 * Gemini başarısızsa veya anlamazsa butonlu menü gösterilir.
 */
async function handleFreeText(phone: string, typed: string, firstMessage: boolean) {
  const procedures = await getBookableProcedures();
  const parsed = await understandMessage(typed, {
    upcoming: nextDays(todayInIstanbul(), 15),
    procedures: procedures.map((p) => p.name),
  });

  if (!parsed || parsed.intent === "greeting" || parsed.intent === "other") {
    // İlk mesajda karşılama; menüdeyken anlaşılmadı uyarısı. Sonra menü.
    const greet = firstMessage || parsed?.intent === "greeting";
    await sendText(phone, greet ? text.greeting : text.errors.notUnderstood);
    return showMenu(phone);
  }

  const hints: Hints = {
    procedureId: procedures.find((p) => p.name === parsed.procedure)?.id,
    hintDate: parsed.date ?? undefined,
    hintPeriod: parsed.time_of_day ?? undefined,
  };
  switch (parsed.intent) {
    case "book":
      return startBooking(phone, hints);
    case "view":
      return showAppointment(phone);
    case "cancel":
      return startChange(phone, "cancel");
    case "reschedule":
      return startChange(phone, "reschedule", hints);
  }
}

// ---------- Menü ----------

async function showMenu(phone: string): Promise<void> {
  await setSession(phone, "menu", {});
  await sendButtons(phone, {
    body: text.steps.menu,
    buttons: [
      { id: "menu:book", title: text.buttons.book },
      { id: "menu:view", title: text.buttons.view },
      { id: "menu:manage", title: text.buttons.cancelOrReschedule },
    ],
  });
}

async function handleMenuChoice(phone: string, replyId: string): Promise<void> {
  switch (replyId) {
    case "menu:book":
      return startBooking(phone);
    case "menu:view":
      return showAppointment(phone);
    case "menu:manage:cancel":
      return startChange(phone, "cancel");
    case "menu:manage:reschedule":
      return startChange(phone, "reschedule");
    default:
      return showManage(phone);
  }
}

/** Hastanın aktif randevusu (hasta kaydı yoksa null). */
async function findActiveAppointment(phone: string): Promise<ActiveAppointment | null> {
  const patient = await getPatientByPhone(phone);
  return patient ? getActiveAppointment(patient.id) : null;
}

function appointmentText(appointment: ActiveAppointment): string {
  return text.appointmentInfo({
    dateTime: formatDateTime(appointment.startsAt),
    doctor: appointment.doctor,
    procedure: appointment.procedure,
    status: getAppointmentStatusLabel(appointment.status),
  });
}

async function showAppointment(phone: string): Promise<void> {
  const appointment = await findActiveAppointment(phone);
  await sendText(phone, appointment ? appointmentText(appointment) : text.noActiveAppointment);
  return showMenu(phone);
}

// ---------- Randevu alma ----------

async function startBooking(phone: string, hints: Hints = {}): Promise<void> {
  const patient = await getPatientByPhone(phone);
  if (!patient) return askName(phone, hints);
  return continueBooking(phone, patient.id, hints);
}

/** Aktif randevu varsa seçenek sun, yoksa işlem listesine geç. */
async function continueBooking(
  phone: string,
  patientId: number,
  hints: Hints = {},
): Promise<void> {
  if (await getActiveAppointment(patientId)) {
    await setSession(phone, "menu", {});
    await sendButtons(phone, {
      body: text.errors.hasActiveAppointment,
      buttons: [
        { id: "menu:view", title: text.buttons.show },
        { id: "menu:manage:cancel", title: text.buttons.cancel },
        { id: "menu:manage:reschedule", title: text.buttons.reschedule },
      ],
    });
    return;
  }
  // Mesajda işlem anlaşıldıysa işlem listesi atlanır.
  if (hints.procedureId) return chooseProcedure(phone, hints.procedureId, hints);
  return showProcedures(phone, hints);
}

async function askName(phone: string, hints: Hints = {}): Promise<void> {
  await setSession(phone, "ask_name", hintsOf(hints));
  await sendText(phone, text.steps.ask_name);
}

async function handleName(phone: string, session: Session, typed: string): Promise<void> {
  const hints = hintsOf(session.context);
  const fullName = normalizeFullName(typed);
  // Geçersiz ad: soruyu tekrarla (ayrı bir hata metni messages.ts'e eklenecek).
  if (!fullName) return askName(phone, hints);

  const patient = await createPatient(phone, fullName);
  if (!patient) {
    await sendText(phone, DEFAULT_ERROR_MESSAGE);
    return showMenu(phone);
  }
  return continueBooking(phone, patient.id, hints);
}

async function showProcedures(phone: string, context: SessionContext): Promise<void> {
  const procedures = await getBookableProcedures();
  if (procedures.length === 0) {
    await sendText(phone, DEFAULT_ERROR_MESSAGE);
    return showMenu(phone);
  }
  const page = context.page ?? 0;
  const rows = procedures.map((p) => ({
    id: `proc:${p.id}`,
    title: fit(p.name, 24),
    description: `${p.durationMinutes} dk`,
  }));
  const { hintDate, hintPeriod } = context;
  await setSession(phone, "choose_procedure", { page, hintDate, hintPeriod });
  await sendList(phone, {
    body: text.steps.choose_procedure,
    buttonText: text.listOpenButtons.procedure,
    sections: [{ rows: paginateRows(rows, page, MORE_OPTIONS_TITLE) }],
  });
}

async function handleProcedure(phone: string, session: Session, replyId: string | null) {
  const { hintDate, hintPeriod } = session.context;
  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showProcedures(phone, { page: more, hintDate, hintPeriod });

  const procedureId = parseNumericId(replyId, "proc:");
  if (!procedureId) return notUnderstood(phone, session);
  return chooseProcedure(phone, procedureId, { hintDate, hintPeriod });
}

/** İşlem seçildi (listeden veya mesajdan): doktor adımına ya da (tek doktorsa) güne geç. */
async function chooseProcedure(phone: string, procedureId: number, hints: Hints) {
  const procedure = await getProcedure(procedureId);
  const doctors = procedure ? await getDoctorsForProcedure(procedure.id) : [];
  if (!procedure || doctors.length === 0) {
    return showProcedures(phone, { hintDate: hints.hintDate, hintPeriod: hints.hintPeriod });
  }
  const context: SessionContext = {
    procedureId: procedure.id,
    hintDate: hints.hintDate,
    hintPeriod: hints.hintPeriod,
  };
  // Tek doktor varsa doktor adımı atlanır.
  if (doctors.length === 1) return goToDates(phone, { ...context, doctorId: doctors[0].id });
  return showDoctors(phone, context);
}

async function showDoctors(phone: string, context: SessionContext): Promise<void> {
  if (!context.procedureId) return showProcedures(phone, {});
  const doctors = await getDoctorsForProcedure(context.procedureId);
  const page = context.page ?? 0;
  const rows = doctors.map((d) => ({
    id: `doc:${d.id}`,
    title: fit(`${d.title} ${d.fullName}`, 24),
    description: fit(d.specialty, 72),
  }));
  const { procedureId, hintDate, hintPeriod } = context;
  await setSession(phone, "choose_doctor", { procedureId, page, hintDate, hintPeriod });
  await sendList(phone, {
    body: text.steps.choose_doctor,
    buttonText: text.listOpenButtons.doctor,
    sections: [{ rows: paginateRows(rows, page, MORE_OPTIONS_TITLE) }],
  });
}

async function handleDoctor(phone: string, session: Session, replyId: string | null) {
  const { procedureId, hintDate, hintPeriod } = session.context;
  if (!procedureId) return showProcedures(phone, {});

  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showDoctors(phone, { procedureId, page: more, hintDate, hintPeriod });

  const doctorId = parseNumericId(replyId, "doc:");
  const doctors = await getDoctorsForProcedure(procedureId);
  if (!doctorId || !doctors.some((d) => d.id === doctorId)) {
    return notUnderstood(phone, session);
  }
  return goToDates(phone, { procedureId, doctorId, hintDate, hintPeriod });
}

// ---------- Tarih ve saat (randevu alma ve erteleme ortak) ----------

/** Seçimden bağımsız kalıcı alanlar: işlem, doktor ve (ertelemede) randevu. */
function baseOf({ procedureId, doctorId, appointmentId }: SessionContext): SessionContext {
  return { procedureId, doctorId, appointmentId };
}

/** Mesajda gün verildiyse doğrudan o güne geç, yoksa gün listesini göster. */
async function goToDates(phone: string, context: SessionContext): Promise<void> {
  if (context.hintDate) {
    return selectDate(phone, baseOf(context), context.hintDate, context.hintPeriod);
  }
  return showDates(phone, context);
}

async function showDates(phone: string, context: SessionContext): Promise<void> {
  const { procedureId, doctorId } = context;
  if (!procedureId || !doctorId) return restart(phone, context);
  const mode = modeOf(context);

  const [settings, openDays] = await Promise.all([getClinicSettings(), getOpenWeekdays()]);
  const dates = upcomingOpenDates(todayInIstanbul(), settings.bookingWindowDays, openDays);
  const page = context.page ?? 0;
  const rows = dates.map((date) => ({
    id: `date:${date}`,
    title: fit(formatDate(istanbulLocalToIso(date, "12:00")), 24),
  }));
  await setSession(phone, MODE_STEPS[mode].date, {
    ...baseOf(context),
    page,
    hintPeriod: context.hintPeriod,
  });
  await sendList(phone, {
    body: MODE_TEXT[mode].date,
    buttonText: text.listOpenButtons.date,
    sections: [{ rows: paginateRows(rows, page, text.listRows.otherDays) }],
  });
}

async function handleDate(phone: string, session: Session, replyId: string | null) {
  const base = baseOf(session.context);
  const { procedureId, doctorId } = base;
  if (!procedureId || !doctorId) return restart(phone, base);

  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showDates(phone, { ...base, page: more });

  const date = replyId?.startsWith("date:") ? replyId.slice("date:".length) : null;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return notUnderstood(phone, session);
  return selectDate(phone, base, date, session.context.hintPeriod);
}

/**
 * Gün seçildi (listeden veya mesajdan). Boş saat yoksa gün listesine döner.
 * Tercih edilen dilimde (mesajdaki "sabah" / "öğleden sonra") saat varsa
 * doğrudan o dilimin saatleri gösterilir.
 */
async function selectDate(
  phone: string,
  base: SessionContext,
  date: string,
  preferred?: TimePeriod,
): Promise<void> {
  const { procedureId, doctorId } = base;
  if (!procedureId || !doctorId) return restart(phone, base);

  const slots = await getAvailableSlots(doctorId, procedureId, date);
  if (slots.length === 0) {
    await sendText(phone, text.errors.noSlotsOnDate);
    return showDates(phone, base);
  }

  const periods = splitByPeriod(slots, (s) => formatTime(s.slot_start));
  const context: SessionContext = { ...base, date };
  if (preferred && periods[preferred].length > 0) {
    return showTimes(phone, { ...context, timePeriod: preferred });
  }
  // 10'dan fazla saat varsa ve iki dilimde de saat varsa önce sabah/öğleden sonra sorulur.
  if (slots.length > 10 && periods.morning.length > 0 && periods.afternoon.length > 0) {
    return showPeriods(phone, context);
  }
  if (slots.length > 10) {
    context.timePeriod = periods.morning.length > 0 ? "morning" : "afternoon";
  }
  return showTimes(phone, context);
}

async function showPeriods(phone: string, context: SessionContext): Promise<void> {
  const { procedureId, doctorId, date } = context;
  if (!procedureId || !doctorId || !date) return restart(phone, context);
  await setSession(phone, MODE_STEPS[modeOf(context)].period, { ...baseOf(context), date });
  await sendButtons(phone, {
    body: text.steps.choose_time_period,
    buttons: [
      { id: "period:morning", title: text.listRows.morning },
      { id: "period:afternoon", title: text.listRows.afternoon },
    ],
  });
}

async function handlePeriod(phone: string, session: Session, replyId: string | null) {
  const timePeriod =
    replyId === "period:morning" ? "morning" : replyId === "period:afternoon" ? "afternoon" : null;
  if (!timePeriod) return notUnderstood(phone, session);
  return showTimes(phone, { ...session.context, timePeriod, page: 0 });
}

/** Seçili gün (ve varsa dilim) için güncel boş saatler. */
async function currentSlots(context: SessionContext) {
  const { procedureId, doctorId, date, timePeriod } = context;
  if (!procedureId || !doctorId || !date) return [];
  const slots = await getAvailableSlots(doctorId, procedureId, date);
  return timePeriod
    ? splitByPeriod(slots, (s) => formatTime(s.slot_start))[timePeriod]
    : slots;
}

async function showTimes(phone: string, context: SessionContext): Promise<void> {
  const { procedureId, doctorId, date, timePeriod } = context;
  if (!procedureId || !doctorId || !date) return restart(phone, context);
  const mode = modeOf(context);

  const slots = await currentSlots(context);
  if (slots.length === 0) {
    await sendText(phone, text.errors.noSlotsOnDate);
    return showDates(phone, baseOf(context));
  }
  const page = context.page ?? 0;
  const rows: ListRow[] = slots.map((s) => ({
    id: `${SLOT_PREFIX}${s.slot_start}`,
    title: formatTime(s.slot_start),
  }));
  await setSession(phone, MODE_STEPS[mode].time, { ...baseOf(context), date, timePeriod, page });
  await sendList(phone, {
    body: MODE_TEXT[mode].time,
    buttonText: text.listOpenButtons.time,
    sections: [{ rows: paginateRows(rows, page, text.listRows.otherTimes) }],
  });
}

async function handleTime(phone: string, session: Session, replyId: string | null) {
  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showTimes(phone, { ...session.context, page: more });

  const slotStart = replyId?.startsWith(SLOT_PREFIX) ? replyId.slice(SLOT_PREFIX.length) : null;
  if (!slotStart || !sessionContextSchema.shape.slotStart.safeParse(slotStart).success) {
    return notUnderstood(phone, session);
  }

  // Liste gönderildikten sonra saat dolmuş olabilir; güncel listeyle kontrol et.
  const slots = await currentSlots(session.context);
  if (!slots.some((s) => Date.parse(s.slot_start) === Date.parse(slotStart))) {
    await sendText(phone, text.errors.slotTaken);
    return showTimes(phone, { ...session.context, page: 0 });
  }
  const context = { ...session.context, slotStart, page: undefined };
  return modeOf(context) === "reschedule"
    ? showRescheduleSummary(phone, context)
    : showSummary(phone, context);
}

// ---------- Özet ve randevu oluşturma ----------

async function showSummary(phone: string, context: SessionContext): Promise<void> {
  const { procedureId, doctorId, slotStart } = context;
  if (!procedureId || !doctorId || !slotStart) return showProcedures(phone, {});

  const [procedure, doctor] = await Promise.all([getProcedure(procedureId), getDoctor(doctorId)]);
  if (!procedure || !doctor) return showProcedures(phone, {});

  await setSession(phone, "confirm", context);
  await sendButtons(phone, {
    body: text.confirmSummary({
      procedure: procedure.name,
      doctor: `${doctor.title} ${doctor.fullName}`,
      dateTime: formatDateTime(slotStart),
    }),
    buttons: [
      { id: "confirm:yes", title: text.buttons.confirm },
      { id: "confirm:change", title: text.buttons.change },
      { id: "confirm:no", title: text.buttons.giveUp },
    ],
  });
}

async function handleConfirm(phone: string, session: Session, replyId: string | null) {
  if (replyId === "confirm:change") return showProcedures(phone, {});
  if (replyId === "confirm:no") return showMenu(phone);
  if (replyId !== "confirm:yes") return notUnderstood(phone, session);

  const { procedureId, doctorId, slotStart } = session.context;
  const [patient, procedure] = await Promise.all([
    getPatientByPhone(phone),
    procedureId ? getProcedure(procedureId) : null,
  ]);
  if (!patient) return askName(phone);
  if (!procedure || !doctorId || !slotStart) return showProcedures(phone, {});

  const endsAt = new Date(
    Date.parse(slotStart) + procedure.durationMinutes * 60_000,
  ).toISOString();
  const error = await createAppointment({
    patientId: patient.id,
    doctorId,
    procedureId: procedure.id,
    startsAt: slotStart,
    endsAt,
  });

  if (error?.code === "23P01") {
    // Bu arada başka biri aynı saati aldı.
    await sendText(phone, text.errors.slotTaken);
    return showTimes(phone, { ...session.context, page: 0 });
  }
  if (error?.code === "RD001") return continueBooking(phone, patient.id);
  if (error) {
    await sendText(phone, DEFAULT_ERROR_MESSAGE);
    return showMenu(phone);
  }

  await resetSession(phone);
  await sendText(phone, text.requestReceived);
}

// ---------- İptal ve erteleme ----------

/** Menüdeki "İptal / Ertele": randevuyu göster, ne yapılacağını sor. */
async function showManage(phone: string): Promise<void> {
  const appointment = await findActiveAppointment(phone);
  if (!appointment) {
    await sendText(phone, text.noActiveAppointment);
    return showMenu(phone);
  }
  await sendText(phone, appointmentText(appointment));
  await setSession(phone, "manage_appointment", { appointmentId: appointment.id });
  await sendButtons(phone, {
    body: text.steps.manage_appointment,
    buttons: [
      { id: "manage:cancel", title: text.buttons.cancel },
      { id: "manage:reschedule", title: text.buttons.reschedule },
      { id: "manage:back", title: text.buttons.giveUp },
    ],
  });
}

async function handleManage(phone: string, session: Session, replyId: string | null) {
  if (replyId === "manage:cancel") return startChange(phone, "cancel");
  if (replyId === "manage:reschedule") return startChange(phone, "reschedule");
  if (replyId === "manage:back") return showMenu(phone);
  return notUnderstood(phone, session);
}

/**
 * İptal veya ertelemeye başlarken: aktif randevu var mı ve süre sınırı
 * (cancel_limit_hours) geçmedi mi? Geçtiyse "kliniği arayın" denir.
 */
async function checkChangeAllowed(phone: string): Promise<ActiveAppointment | null> {
  const appointment = await findActiveAppointment(phone);
  if (!appointment) {
    await sendText(phone, text.noActiveAppointment);
    await showMenu(phone);
    return null;
  }
  const settings = await getClinicSettings();
  if (!canPatientChange(appointment.startsAt, settings.cancelLimitHours)) {
    // Klinik telefonu ayarlarda yoksa cümle "...arayın: " diye yarım kalmasın.
    const message = settings.phone
      ? text.errors.cancelDeadlinePassed(clinicPhoneText(settings.phone))
      : text.errors.cancelDeadlinePassed("").replace(/:\s*$/, ".");
    await sendText(phone, message);
    await showMenu(phone);
    return null;
  }
  return appointment;
}

async function startChange(
  phone: string,
  action: "cancel" | "reschedule",
  hints: Hints = {},
): Promise<void> {
  const appointment = await checkChangeAllowed(phone);
  if (!appointment) return;

  if (action === "reschedule") {
    return goToDates(phone, {
      appointmentId: appointment.id,
      procedureId: appointment.procedureId,
      doctorId: appointment.doctorId,
      hintDate: hints.hintDate,
      hintPeriod: hints.hintPeriod,
    });
  }
  await setSession(phone, "confirm_cancel", { appointmentId: appointment.id });
  await sendButtons(phone, {
    body: text.steps.confirm_cancel,
    buttons: [
      { id: "cancel:yes", title: text.buttons.yesCancel },
      { id: "cancel:no", title: text.buttons.giveUp },
    ],
  });
}

/**
 * Oturumdaki randevu hâlâ bu hastanın aktif randevusu mu ve süre sınırı uygun mu?
 * Değilse kullanıcıya bilgi verip null döner (randevu bu arada değişmiş olabilir).
 */
async function confirmTarget(phone: string, session: Session) {
  const appointment = await checkChangeAllowed(phone);
  if (!appointment) return null;
  if (appointment.id !== session.context.appointmentId) {
    await sendText(phone, getErrorMessage({ code: "RD003" }));
    await showMenu(phone);
    return null;
  }
  return appointment;
}

async function handleCancelConfirm(phone: string, session: Session, replyId: string | null) {
  if (replyId === "cancel:no") return showMenu(phone);
  if (replyId !== "cancel:yes") return notUnderstood(phone, session);

  const appointment = await confirmTarget(phone, session);
  if (!appointment) return;

  const patient = await getPatientByPhone(phone);
  const cancelled = patient ? await cancelAppointment(appointment.id, patient.id) : false;
  if (!cancelled) {
    await sendText(phone, getErrorMessage({ code: "RD003" }));
    return showMenu(phone);
  }
  await resetSession(phone);
  await sendText(phone, text.cancelDone);
}

async function showRescheduleSummary(phone: string, context: SessionContext): Promise<void> {
  if (!context.appointmentId || !context.slotStart) return showMenu(phone);
  await setSession(phone, "confirm_reschedule", context);
  await sendButtons(phone, {
    body: text.confirmReschedule(formatDateTime(context.slotStart)),
    buttons: [
      { id: "resch:yes", title: text.buttons.confirm },
      { id: "resch:no", title: text.buttons.giveUp },
    ],
  });
}

async function handleRescheduleConfirm(phone: string, session: Session, replyId: string | null) {
  if (replyId === "resch:no") return showMenu(phone);
  if (replyId !== "resch:yes") return notUnderstood(phone, session);

  const { slotStart } = session.context;
  if (!slotStart) return showMenu(phone);
  const appointment = await confirmTarget(phone, session);
  if (!appointment) return;

  const error = await rescheduleAppointment(appointment.id, slotStart);
  if (error?.code === "23P01" || error?.code === "RD004") {
    // Yeni saat bu arada doldu; eski randevu olduğu gibi duruyor.
    await sendText(phone, text.errors.slotTaken);
    return showTimes(phone, { ...session.context, slotStart: undefined, page: 0 });
  }
  if (error) {
    await sendText(phone, getErrorMessage(error));
    return showMenu(phone);
  }
  await resetSession(phone);
  await sendText(phone, text.rescheduleRequestReceived);
}

// ---------- Yardımcılar ----------

/** "proc:3" → 3. Biçim tutmuyorsa null. */
function parseNumericId(replyId: string | null, prefix: string): number | null {
  if (!replyId?.startsWith(prefix)) return null;
  const id = Number(replyId.slice(prefix.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Ayarlardaki telefon "0212 ..." gibi de yazılmış olabilir; tanınırsa "+90 ..." biçimine çevrilir. */
function clinicPhoneText(raw: string): string {
  const normalized = normalizePhone(raw);
  return normalized ? formatPhone(normalized) : raw.trim();
}

/** Meta sınırını aşan metni kısaltır (sonuna "…"). */
function fit(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
