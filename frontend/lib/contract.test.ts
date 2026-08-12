import { describe, expect, it } from "vitest";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { receiptFailure } from "./contract";

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
