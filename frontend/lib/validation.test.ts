import { describe, expect, it } from "vitest";
import { canonicalXUrl } from "./validation";

describe("canonical X URLs", () => {
  it("normalizes supported hosts", () => {
    expect(canonicalXUrl("https://twitter.com/alice/status/123")).toBe("https://x.com/alice/status/123");
  });

  it("rejects lookalikes", () => {
    expect(() => canonicalXUrl("https://x.com.evil.test/alice/status/123")).toThrow();
  });

  it("strips query parameters and fragments to produce the canonical form", () => {
    expect(canonicalXUrl("https://x.com/alice/status/123?s=20")).toBe("https://x.com/alice/status/123");
    expect(canonicalXUrl("https://www.x.com/bob/status/456?ref=homepage#bottom")).toBe("https://x.com/bob/status/456");
  });
});
