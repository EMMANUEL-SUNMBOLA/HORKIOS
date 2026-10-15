import { describe, expect, it } from "vitest";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import { expectedReleaseId, isTransientRpcError, receiptFailure, receiptStatus, validateContractConfig } from "./contract";
import { chain } from "./contract";
import { studionet } from "genlayer-js/chains";

describe("transaction receipt outcomes", () => {
  it("accepts only a finalized successful execution", () => {
    expect(receiptFailure({
      status_name: TransactionStatus.FINALIZED,
      txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
    })).toBeNull();
  });

  it("classifies validator disagreement separately", () => {
    expect(receiptFailure({ status_name: TransactionStatus.UNDETERMINED })).toBe("undetermined");
  });

  it("rejects finalized execution errors and missing execution results", () => {
    expect(receiptFailure({
      status_name: TransactionStatus.FINALIZED,
      txExecutionResultName: ExecutionResult.FINISHED_WITH_ERROR,
    })).toBe("execution");
    expect(receiptFailure({ status_name: TransactionStatus.FINALIZED })).toBe("execution");
  });

  it("reads studio receipts from the leader receipt when the execution result is absent", () => {
    expect(receiptFailure({
      status_name: TransactionStatus.FINALIZED,
      consensus_data: {
        leader_receipt: [
          { mode: "leader", execution_result: "SUCCESS" },
          { mode: "validator", execution_result: "SUCCESS" },
        ],
      },
    })).toBeNull();
    expect(receiptFailure({
      status_name: TransactionStatus.FINALIZED,
      consensus_data: {
        leader_receipt: [
          { mode: "leader", execution_result: "ERROR", genvm_result: { stderr: "Traceback (most recent call last)..." } },
        ],
      },
    })).toBe("execution");
    expect(receiptFailure({
      status_name: TransactionStatus.FINALIZED,
      consensus_data: { leader_receipt: [{ mode: "validator", execution_result: "ERROR" }] },
    })).toBe("execution");
  });

  it("does not treat an accepted receipt as final", () => {
    expect(receiptFailure({ status_name: TransactionStatus.ACCEPTED })).toBeNull();
  });

  it("still honors the legacy camelCase spellings", () => {
    expect(receiptFailure({
      statusName: TransactionStatus.UNDETERMINED,
    })).toBe("undetermined");
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      txExecutionResultName: ExecutionResult.FINISHED_WITH_ERROR,
    })).toBe("execution");
  });
});

describe("consensus v0.6 receipt shapes", () => {
  it("resolves numeric, named, and snake_case statuses", () => {
    expect(receiptStatus({ status: 7 })).toBe(TransactionStatus.FINALIZED);
    expect(receiptStatus({ status: TransactionStatus.ACCEPTED })).toBe(TransactionStatus.ACCEPTED);
    expect(receiptStatus({ statusName: TransactionStatus.UNDETERMINED })).toBe(TransactionStatus.UNDETERMINED);
    expect(receiptStatus({ status_name: TransactionStatus.FINALIZED })).toBe(TransactionStatus.FINALIZED);
    expect(receiptStatus({})).toBeUndefined();
  });

  it("classifies a numeric v0.6 undetermined status", () => {
    expect(receiptFailure({ status: 6 })).toBe("undetermined");
  });

  it("reads v0.6 leader receipt errors from the error field", () => {
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      consensus_data: { leader_receipt: [{ mode: "leader", execution_result: "SUCCESS", error: null }] },
    })).toBeNull();
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      consensus_data: { leader_receipt: [{ mode: "leader", execution_result: "FINISHED_WITH_ERROR" }] },
    })).toBe("execution");
    expect(receiptFailure({
      statusName: TransactionStatus.FINALIZED,
      consensus_data: { leader_receipt: [{ mode: "leader", execution_result: "SUCCESS", error: "TypeError: boom" }] },
    })).toBe("execution");
  });
});

describe("contract release configuration", () => {
  const validConfig = {
    release_id: expectedReleaseId,
    fee_recipient: "0x23a3bD9d047052318Fd51ff6ade53002DEF9F2fA",
    fee_bps: 100,
    max_demands: 10,
    termination_window: 172800,
  };

  it("accepts the exact HORKIOS release", () => {
    expect(validateContractConfig(validConfig)).toEqual(validConfig);
  });

  it("rejects the retired build without a release identity", () => {
    expect(() => validateContractConfig({ ...validConfig, release_id: undefined })).toThrow(
      "does not match",
    );
  });

  it("rejects a mismatched fee recipient or release identity", () => {
    expect(() => validateContractConfig({ ...validConfig, release_id: "older-release" })).toThrow();
    expect(() => validateContractConfig({
      ...validConfig,
      fee_recipient: "0x0000000000000000000000000000000000000000",
    })).toThrow();
  });
});

describe("browser RPC transport", () => {
  it("uses the same-origin relay without mutating the official wallet chain", () => {
    expect(chain.rpcUrls.default.http[0]).toBe("/api/genlayer-rpc");
    expect(studionet.rpcUrls.default.http[0]).toBe("https://studio.genlayer.com/api");
  });

  it("treats the relay's unavailable response as a monitoring delay", () => {
    expect(isTransientRpcError(new Error("GenLayer studionet RPC is unavailable"))).toBe(true);
  });
});
