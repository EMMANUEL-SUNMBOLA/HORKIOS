import { describe, expect, it } from "vitest";
import { clearPendingCreate, loadPendingCreate, savePendingCreate, type PendingCreate } from "./pending-create";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const pending: PendingCreate = { version: 1, network: "studionet", contract: "0x1111111111111111111111111111111111111111", creator: "0x2222222222222222222222222222222222222222", secret: `0x${"ab".repeat(32)}`, inviteHash: "cd".repeat(32), acceptanceDeadline: 2_000, createdAt: 1_000, txHash: "0x123" };

describe("pending campaign creation", () => {
  it("survives a page reload until the invitation is copied", () => {
    const storage = new MemoryStorage();
    savePendingCreate(pending, storage);
    expect(loadPendingCreate(pending.network, pending.contract, pending.creator, storage, 1_500)).toEqual(pending);
    clearPendingCreate(pending, storage);
    expect(loadPendingCreate(pending.network, pending.contract, pending.creator, storage, 1_500)).toBeNull();
  });

  it("discards expired or mismatched records", () => {
    const storage = new MemoryStorage();
    savePendingCreate(pending, storage);
    expect(loadPendingCreate(pending.network, pending.contract, pending.creator, storage, 2_001)).toBeNull();
  });
});
