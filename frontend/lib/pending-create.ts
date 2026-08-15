import type { Address } from "./types";

export type PendingCreate = { version: 1; network: string; contract: Address; creator: Address; secret: string; inviteHash: string; acceptanceDeadline: number; createdAt: number; txHash?: string };

const key = (network: string, contract: string, creator: string) => `horkios:pending-create:v1:${network}:${contract.toLowerCase()}:${creator.toLowerCase()}`;

export function savePendingCreate(value: PendingCreate, storage: Storage = sessionStorage) {
  storage.setItem(key(value.network, value.contract, value.creator), JSON.stringify(value));
}

export function loadPendingCreate(network: string, contract: Address, creator: Address, storage: Storage = sessionStorage, now = Math.floor(Date.now() / 1000)): PendingCreate | null {
  const storageKey = key(network, contract, creator);
  try {
    const value = JSON.parse(storage.getItem(storageKey) || "null") as PendingCreate | null;
    if (!value || value.version !== 1 || value.network !== network || value.contract.toLowerCase() !== contract.toLowerCase() || value.creator.toLowerCase() !== creator.toLowerCase() || value.acceptanceDeadline <= now || !/^0x[0-9a-f]{64}$/i.test(value.secret) || !/^[0-9a-f]{64}$/i.test(value.inviteHash)) {
      storage.removeItem(storageKey); return null;
    }
    return value;
  } catch { storage.removeItem(storageKey); return null; }
}

export function clearPendingCreate(value: Pick<PendingCreate, "network" | "contract" | "creator">, storage: Storage = sessionStorage) {
  storage.removeItem(key(value.network, value.contract, value.creator));
}
