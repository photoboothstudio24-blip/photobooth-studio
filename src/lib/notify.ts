/** Best-effort WhatsApp message to the shop owner via CallMeBot (free, personal-use). Never throws; a failure must not block a customer. */
export function proofMessage(o: { order: string; plan: string; amount: number; site: string }) {
  const rp = new Intl.NumberFormat("id-ID").format(o.amount);
  return `Bukti pembayaran baru\nPesanan ${o.order}\nPaket ${o.plan} - Rp${rp}\nCek di ${o.site}/admin`;
}

export async function notifyOwner(text: string): Promise<boolean> {
  const phone = process.env.OWNER_WHATSAPP, apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return false;
  try {
    const url = new URL("https://api.callmebot.com/whatsapp.php");
    url.search = new URLSearchParams({ phone, text, apikey }).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
