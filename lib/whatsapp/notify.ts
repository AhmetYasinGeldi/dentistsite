// Bot ekibi (Sevde) tarafından doldurulacak, imza değiştirilmez.
// Panel ekibi randevu onay/red/iptal sonrası bu fonksiyonu çağırır.
import "server-only";

export async function notifyAppointmentUpdate(
  appointmentId: number,
): Promise<{ sent: boolean; reason?: string }> {
  void appointmentId;
  return { sent: false, reason: "NOT_IMPLEMENTED" };
}
