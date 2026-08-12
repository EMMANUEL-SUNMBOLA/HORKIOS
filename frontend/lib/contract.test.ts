import { describe, expect, it } from "vitest";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { receiptFailure } from "./contract";
import { chain } from "./contract";
import { studionet } from "genlayer-js/chains";

describe("transaction receipt outcomes", () => {
  it("accepts only a finalized successful execution", () => {
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
    })).toBeNull();
  });

  it("classifies validator disagreement separately", () => {
    expect(receiptFailure({ statusName: TransactionStatus.UNDETERMINED })).toBe("undetermined");
  });

  it("rejects finalized execution errors and missing execution results", () => {
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      txExecutionResultName: ExecutionResult.FINISHED_WITH_ERROR,
    })).toBe("execution");
    expect(receiptFailure({ statusName: TransactionStatus.FINALIZED })).toBe("execution");
  });

  it("does not treat an accepted receipt as final", () => {
    expect(receiptFailure({ statusName: TransactionStatus.ACCEPTED })).toBeNull();
  });
});

describe("browser RPC transport", () => {
  it("uses the same-origin relay without mutating the official wallet chain", () => {
    expect(chain.rpcUrls.default.http[0]).toBe("/api/genlayer-rpc");
    expect(studionet.rpcUrls.default.http[0]).toBe("https://studio.genlayer.com/api");
  });
});
