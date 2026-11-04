import "server-only";

import * as text from "@/lib/bot/messages";
import {
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
} from "@/lib/bot/queries";
import { normalizeFullName, splitByPeriod, upcomingOpenDates } from "@/lib/bot/schedule";
import {
  getSession,
  resetSession,
  sessionContextSchema,
  setSession,
  type Session,
  type SessionContext,
} from "@/lib/bot/session";
import { getAppointmentStatusLabel } from "@/lib/shared/appointment-status";
import {
  formatDate,
  formatDateTime,
  formatTime,
  istanbulLocalToIso,
  todayInIstanbul,
} from "@/lib/shared/datetime";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/shared/errors";
import { paginateRows, parseMoreRowId, type ListRow } from "@/lib/whatsapp/interactive";
import { getReplyId, type IncomingMessage } from "@/lib/whatsapp/payload";
import { sendButtons, sendList, sendText } from "@/lib/whatsapp/send";

// Sohbet akışı (AGENTS.md 8. bölüm). Her gelen mesaj, oturumdaki adıma göre
// işlenir; her adımın mesajını gönderen "show" fonksiyonu adımı da kaydeder.
// Buton ve liste satırlarının id'leri "<tür>:<değer>" biçimindedir.

const MENU_WORDS = ["menü", "menu", "ana menü", "anamenü"];
const SLOT_PREFIX = "slot:";

// TODO(Ebru): İşlem/doktor listesi 10'u geçerse kullanılacak satır başlığı;
// messages.ts'e eklenince oradan alınacak (tasks.md).
const MORE_OPTIONS_TITLE = "Diğer seçenekler";

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
      await sendText(phone, text.greeting);
      return showMenu(phone);
    case "ask_name":
      return handleName(phone, typed);
    case "choose_procedure":
      return handleProcedure(phone, session, replyId);
    case "choose_doctor":
      return handleDoctor(phone, session, replyId);
    case "choose_date":
      return handleDate(phone, session, replyId);
    case "choose_time_period":
      return handlePeriod(phone, session, replyId);
    case "choose_time":
      return handleTime(phone, session, replyId);
    case "confirm":
      return handleConfirm(phone, session, replyId);
    default:
      // menu ve henüz bağlanmamış iptal/erteleme adımları
      return notUnderstood(phone, session);
  }
}

/** Anlaşılmayan cevap: uyarı ve o adımın sorusunu tekrar gönder. */
async function notUnderstood(phone: string, session: Session): Promise<void> {
  await sendText(phone, text.errors.notUnderstood);
  const c = session.context;
  switch (session.step) {
    case "ask_name":
      return askName(phone);
    case "choose_procedure":
      return showProcedures(phone, c);
    case "choose_doctor":
      return showDoctors(phone, c);
    case "choose_date":
      return showDates(phone, c);
    case "choose_time_period":
      return showPeriods(phone, c);
    case "choose_time":
      return showTimes(phone, c);
    case "confirm":
      return showSummary(phone, c);
    default:
      return showMenu(phone);
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
  if (replyId === "menu:book") return startBooking(phone);
  // İptal/erteleme ayrı kartta bağlanacak; şimdilik randevu bilgisi gösterilir.
  return showAppointment(phone);
}

async function showAppointment(phone: string): Promise<void> {
  const patient = await getPatientByPhone(phone);
  const appointment = patient ? await getActiveAppointment(patient.id) : null;
  await sendText(
    phone,
    appointment
      ? text.appointmentInfo({
          dateTime: formatDateTime(appointment.startsAt),
          doctor: appointment.doctor,
          procedure: appointment.procedure,
          status: getAppointmentStatusLabel(appointment.status),
        })
      : text.noActiveAppointment,
  );
  return showMenu(phone);
}

// ---------- Randevu alma ----------

async function startBooking(phone: string): Promise<void> {
  const patient = await getPatientByPhone(phone);
  if (!patient) return askName(phone);
  return continueBooking(phone, patient.id);
}

/** Aktif randevu varsa seçenek sun, yoksa işlem listesine geç. */
async function continueBooking(phone: string, patientId: number): Promise<void> {
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
  return showProcedures(phone, {});
}

async function askName(phone: string): Promise<void> {
  await setSession(phone, "ask_name", {});
  await sendText(phone, text.steps.ask_name);
}

async function handleName(phone: string, typed: string): Promise<void> {
  const fullName = normalizeFullName(typed);
  // Geçersiz ad: soruyu tekrarla (ayrı bir hata metni messages.ts'e eklenecek).
  if (!fullName) return askName(phone);

  const patient = await createPatient(phone, fullName);
  if (!patient) {
    await sendText(phone, DEFAULT_ERROR_MESSAGE);
    return showMenu(phone);
  }
  return continueBooking(phone, patient.id);
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
  await setSession(phone, "choose_procedure", { page });
  await sendList(phone, {
    body: text.steps.choose_procedure,
    buttonText: text.listOpenButtons.procedure,
    sections: [{ rows: paginateRows(rows, page, MORE_OPTIONS_TITLE) }],
  });
}

async function handleProcedure(phone: string, session: Session, replyId: string | null) {
  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showProcedures(phone, { page: more });

  const procedureId = parseNumericId(replyId, "proc:");
  const procedure = procedureId ? await getProcedure(procedureId) : null;
  if (!procedure) return notUnderstood(phone, session);

  const doctors = await getDoctorsForProcedure(procedure.id);
  if (doctors.length === 0) return notUnderstood(phone, session);
  // Tek doktor varsa doktor adımı atlanır.
  if (doctors.length === 1) {
    return showDates(phone, { procedureId: procedure.id, doctorId: doctors[0].id });
  }
  return showDoctors(phone, { procedureId: procedure.id });
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
  await setSession(phone, "choose_doctor", { procedureId: context.procedureId, page });
  await sendList(phone, {
    body: text.steps.choose_doctor,
    buttonText: text.listOpenButtons.doctor,
    sections: [{ rows: paginateRows(rows, page, MORE_OPTIONS_TITLE) }],
  });
}

async function handleDoctor(phone: string, session: Session, replyId: string | null) {
  const { procedureId } = session.context;
  if (!procedureId) return showProcedures(phone, {});

  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showDoctors(phone, { procedureId, page: more });

  const doctorId = parseNumericId(replyId, "doc:");
  const doctors = await getDoctorsForProcedure(procedureId);
  if (!doctorId || !doctors.some((d) => d.id === doctorId)) {
    return notUnderstood(phone, session);
  }
  return showDates(phone, { procedureId, doctorId });
}

async function showDates(phone: string, context: SessionContext): Promise<void> {
  const { procedureId, doctorId } = context;
  if (!procedureId || !doctorId) return showProcedures(phone, {});

  const [settings, openDays] = await Promise.all([getClinicSettings(), getOpenWeekdays()]);
  const dates = upcomingOpenDates(todayInIstanbul(), settings.bookingWindowDays, openDays);
  const page = context.page ?? 0;
  const rows = dates.map((date) => ({
    id: `date:${date}`,
    title: fit(formatDate(istanbulLocalToIso(date, "12:00")), 24),
  }));
  await setSession(phone, "choose_date", { procedureId, doctorId, page });
  await sendList(phone, {
    body: text.steps.choose_date,
    buttonText: text.listOpenButtons.date,
    sections: [{ rows: paginateRows(rows, page, text.listRows.otherDays) }],
  });
}

async function handleDate(phone: string, session: Session, replyId: string | null) {
  const { procedureId, doctorId } = session.context;
  if (!procedureId || !doctorId) return showProcedures(phone, {});

  const more = replyId ? parseMoreRowId(replyId) : null;
  if (more !== null) return showDates(phone, { procedureId, doctorId, page: more });

  const date = replyId?.startsWith("date:") ? replyId.slice("date:".length) : null;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return notUnderstood(phone, session);

  const slots = await getAvailableSlots(doctorId, procedureId, date);
  if (slots.length === 0) {
    await sendText(phone, text.errors.noSlotsOnDate);
    return showDates(phone, { procedureId, doctorId });
  }

  // 10'dan fazla saat varsa ve iki dilimde de saat varsa önce sabah/öğleden sonra sorulur.
  const periods = splitByPeriod(slots, (s) => formatTime(s.slot_start));
  const context: SessionContext = { procedureId, doctorId, date };
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
  if (!procedureId || !doctorId || !date) return showProcedures(phone, {});
  await setSession(phone, "choose_time_period", { procedureId, doctorId, date });
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
  if (!procedureId || !doctorId || !date) return showProcedures(phone, {});

  const slots = await currentSlots(context);
  if (slots.length === 0) {
    await sendText(phone, text.errors.noSlotsOnDate);
    return showDates(phone, { procedureId, doctorId });
  }
  const page = context.page ?? 0;
  const rows: ListRow[] = slots.map((s) => ({
    id: `${SLOT_PREFIX}${s.slot_start}`,
    title: formatTime(s.slot_start),
  }));
  await setSession(phone, "choose_time", { procedureId, doctorId, date, timePeriod, page });
  await sendList(phone, {
    body: text.steps.choose_time,
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
  return showSummary(phone, { ...session.context, slotStart, page: undefined });
}

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

// ---------- Yardımcılar ----------

/** "proc:3" → 3. Biçim tutmuyorsa null. */
function parseNumericId(replyId: string | null, prefix: string): number | null {
  if (!replyId?.startsWith(prefix)) return null;
  const id = Number(replyId.slice(prefix.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Meta sınırını aşan metni kısaltır (sonuna "…"). */
function fit(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
