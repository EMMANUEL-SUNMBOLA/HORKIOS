import { describe, expect, it } from "vitest";
import { canonicalXUrl } from "./validation";

describe("canonical X URLs", () => {
  it("normalizes supported hosts", () => {
    expect(canonicalXUrl("https://twitter.com/alice/status/123")).toBe("https://x.com/alice/status/123");
  });

  it("rejects lookalikes and tracking parameters", () => {
    expect(() => canonicalXUrl("https://x.com.evil.test/alice/status/123")).toThrow();
    expect(() => canonicalXUrl("https://x.com/alice/status/123?s=20")).toThrow();
  });
});
