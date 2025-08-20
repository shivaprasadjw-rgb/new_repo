// Minimal notification facade; wire real providers later
export type EmailPayload = { to: string; subject: string; html: string };
export type WhatsAppPayload = { to: string; text: string };

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean }> {
  console.log("[email]", payload.to, payload.subject);
  return { ok: true };
}

export async function sendWhatsApp(payload: WhatsAppPayload): Promise<{ ok: boolean }> {
  console.log("[whatsapp]", payload.to, payload.text);
  return { ok: true };
}


