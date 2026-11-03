// Panel ekibi randevu onay/red/iptal sonrası bu fonksiyonu çağırır.
// İmza AGENTS.md'de sabittir, değiştirilmez.
import "server-only";

import { notifications } from "@/lib/bot/messages";
import { formatDateTime } from "@/lib/shared/datetime";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText } from "@/lib/whatsapp/send";

// Meta, hastanın son mesajından sonraki 24 saat içinde serbest mesaja izin verir.
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Randevunun güncel durumuna göre hastaya WhatsApp bildirimi gönderir.
 * Onaylandı, reddedildi ve klinik iptal etti durumlarında mesaj gider;
 * diğer durumlarda (ör. hasta kendisi iptal etti) gönderilecek mesaj yoktur.
 * Hata fırlatmaz. reason değerleri:
 * NOT_FOUND, NO_NOTIFICATION, WINDOW_CLOSED, SEND_FAILED, DB_ERROR.
 */
export async function notifyAppointmentUpdate(
  appointmentId: number,
): Promise<{ sent: boolean; reason?: string }> {
  const supabase = createAdminClient();

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("status, starts_at, cancelled_by, patients(phone)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) {
    console.error("[whatsapp/notify] Randevu okunamadı:", error);
    return { sent: false, reason: "DB_ERROR" };
  }
  if (!appointment?.patients) return { sent: false, reason: "NOT_FOUND" };

  const text = buildNotification(
    appointment.status,
    appointment.cancelled_by,
    appointment.starts_at,
  );
  if (!text) return { sent: false, reason: "NO_NOTIFICATION" };

  const phone = appointment.patients.phone;

  // Pencere kapalıysa Meta'ya hiç istek atma; panel uyarı gösterir.
  const { data: session, error: sessionError } = await supabase
    .from("wa_sessions")
    .select("last_inbound_at")
    .eq("phone", phone)
    .maybeSingle();
  if (sessionError) console.error("[whatsapp/notify] Oturum okunamadı:", sessionError);

  const lastInbound = session?.last_inbound_at ? Date.parse(session.last_inbound_at) : NaN;
  if (Number.isNaN(lastInbound) || Date.now() - lastInbound > WINDOW_MS) {
    return { sent: false, reason: "WINDOW_CLOSED" };
  }

  const result = await sendText(phone, text);
  if (result.ok) return { sent: true };
  return {
    sent: false,
    reason: result.reason === "WINDOW_CLOSED" ? "WINDOW_CLOSED" : "SEND_FAILED",
  };
}

/** Durum için hastaya gidecek metin; bildirim gerekmiyorsa null. */
function buildNotification(
  status: string,
  cancelledBy: string | null,
  startsAt: string,
): string | null {
  const when = formatDateTime(startsAt);
  if (status === "approved") return notifications.approved(when);
  if (status === "rejected") return notifications.rejected;
  if (status === "cancelled" && cancelledBy === "admin") {
    return notifications.clinicCancelled(when);
  }
  return null;
}
