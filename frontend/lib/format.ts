const WEI = 10n ** 18n;

export function parseGen(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,18})?$/.test(normalized)) throw new Error("Enter a valid GEN amount");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * WEI + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

export function formatGen(value: bigint | number | string, precision = 4): string {
  const amount = BigInt(value || 0);
  const whole = amount / WEI;
  const fraction = (amount % WEI).toString().padStart(18, "0").slice(0, precision).replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} GEN`;
}

export function unixSeconds(localDateTime: string): number {
  const time = new Date(localDateTime).getTime();
  if (!Number.isFinite(time)) throw new Error("Enter a valid date and time");
  return Math.floor(time / 1000);
}

export function formatDate(value: bigint | number | string): string {
  const seconds = Number(value);
  if (!seconds) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(seconds * 1000);
}

export function truncateAddress(value?: string): string {
  return value && value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value || "Not connected";
}

export function campaignStatus(status: number): string {
  return ["Awaiting KOL review", "Deadline proposal pending", "Oath active", "Termination under review", "Oath settled", "Cancelled and refunded"][status] ?? "Unknown";
}

export function demandStatus(status: number): string {
  return ["Proposed", "Awaiting proof", "Proof submitted", "Verified and paid", "Expired and refunded"][status] ?? "Unknown";
}
