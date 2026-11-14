// Public payment destinations shown to customers. Edit here to change them.
export type PayMethod = "bri" | "jago" | "gopay";
export const PAYMENT_ACCOUNTS: { id: PayMethod; label: string; number: string; holder: string }[] = [
  { id: "bri", label: "BRI", number: "774201023503509", holder: "Riski Al Julian" },
  { id: "jago", label: "Bank Jago", number: "105589792103", holder: "Riski Al Julian" },
  { id: "gopay", label: "GoPay", number: "08818202500", holder: "Riski Al Julian" },
];
export const PAY_METHODS = PAYMENT_ACCOUNTS.map((a) => a.id);
export const isPayMethod = (v: unknown): v is PayMethod => typeof v === "string" && (PAY_METHODS as string[]).includes(v);
export const ORDER_RE = /^PBS-[0-9A-F]{8}$/;
