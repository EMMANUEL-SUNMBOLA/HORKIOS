export function randomInviteSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

export async function inviteCommitment(secret: string): Promise<string> {
  if (!/^[0-9a-f]{64}$/.test(secret)) throw new Error("Invalid invitation secret");
  const bytes = Uint8Array.from(secret.match(/.{2}/g)!.map(value => Number.parseInt(value, 16)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}

export function readInviteFragment(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const value = params.get("invite");
  return value && /^[0-9a-f]{64}$/.test(value) ? value : null;
}
