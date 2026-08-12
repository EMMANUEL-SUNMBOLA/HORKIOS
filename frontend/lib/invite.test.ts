import { describe, expect, it } from "vitest";
import { inviteCommitment, randomInviteSecret } from "./invite";

describe("invitation secrets", () => {
  it("generates 256 random bits as lowercase hex", () => {
    expect(randomInviteSecret()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes the secret using SHA-256", async () => {
    await expect(inviteCommitment("00".repeat(32))).resolves.toBe("66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925");
  });
});
