import { describe, expect, it } from "vitest";
import { formatGen, parseGen, unixSeconds } from "./format";

describe("GEN formatting", () => {
  it("round trips values at wei precision", () => {
    expect(parseGen("12.345678901234567890")).toBe(12_345_678_901_234_567_890n);
    expect(formatGen(parseGen("12.3456"))).toBe("12.3456 GEN");
  });

  it("rejects negative and over-precision inputs", () => {
    expect(() => parseGen("-1")).toThrow();
    expect(() => parseGen("1.0000000000000000001")).toThrow();
  });

  it("converts local date inputs to Unix seconds", () => {
    expect(unixSeconds("2030-01-01T00:00")).toBe(Math.floor(new Date("2030-01-01T00:00").getTime() / 1000));
  });
});
