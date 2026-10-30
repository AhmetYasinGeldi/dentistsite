import "server-only";

import { sendTextMessage } from "@/lib/whatsapp/send";
import type { IncomingMessage } from "@/lib/whatsapp/payload";

// Geçici yankı botu: gelen metni geri yollar. Gerçek sohbet akışı gelince
// webhook bu fonksiyon yerine akışın giriş fonksiyonunu çağıracak.
export async function handleEcho(message: IncomingMessage): Promise<void> {
  const reply =
    message.type === "text" && message.text
      ? message.text.body
      : "Şu an yalnızca yazılı mesajları anlayabiliyorum.";

  await sendTextMessage(message.from, reply);
}
