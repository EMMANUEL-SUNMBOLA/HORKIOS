import { createClient } from "genlayer-js";
import { ExecutionResult, TransactionStatus, transactionsStatusNumberToName } from "genlayer-js/types";
import type { Hash } from "genlayer-js/types";
import type { Address, Campaign } from "./types";
import { chain, networkName } from "./genlayer/network";
import { submitContractWrite, type Eip1193Provider } from "./genlayer/kit";

export { chain, expectedChainId, networkName, officialChain } from "./genlayer/network";

declare global {
  interface Window { ethereum?: unknown; }
}

export const contractAddress = process.env.NEXT_PUBLIC_HORKIOS_CONTRACT_ADDRESS as Address | undefined;
export const expectedReleaseId = "horkios-escrow-2026-10-studio-next-v3";

export const readClient = createClient({ chain });

export function writeClient(address: Address) {
  const injected = typeof window === "undefined" ? undefined : window.ethereum as Eip1193Provider | undefined;
  if (!injected) throw new Error("A browser wallet is required");
  return {
    writeContract(request: { address: Address; functionName: string; args?: unknown[]; value?: bigint }) {
      return submitContractWrite(request, address, injected);
    },
  };
}

export function requireContract(): Address {
  if (!contractAddress) throw new Error("HORKIOS contract address is not configured");
  return contractAddress;
}

export async function readCampaign(id: number): Promise<Campaign> {
  return await readClient.readContract({ address: requireContract(), functionName: "get_campaign", args: [id] }) as Campaign;
}

export class UndeterminedTransactionError extends Error {
  constructor() { super("Validators could not agree. No contract state or funds changed; retry when the evidence source is stable."); }
}

export class TransactionStatusUnavailableError extends Error {
  constructor() { super("The transaction was submitted, but its status is temporarily unavailable. Do not resubmit it; resume monitoring with the same transaction hash."); }
}

export type LeaderReceiptEntry = {
  mode?: string;
  execution_result?: string;
  error?: string | null;
  genvm_result?: { stderr?: string };
  result?: unknown;
};

export type ReceiptOutcome = {
  hash?: Hash;
  status?: TransactionStatus | number;
  status_name?: TransactionStatus;
  statusName?: TransactionStatus;
  txExecutionResultName?: ExecutionResult;
  txExecutionResult?: number;
  consensus_data?: { leader_receipt?: LeaderReceiptEntry[] };
};

const statusByNumber = transactionsStatusNumberToName as unknown as Record<string, TransactionStatus>;

/** Resolve the persisted lifecycle status across v1 (snake_case) and v0.6 (camelCase/number) receipts. */
export function receiptStatus(receipt: ReceiptOutcome): TransactionStatus | undefined {
  const raw = receipt.statusName ?? receipt.status_name ?? receipt.status;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return statusByNumber[String(raw)];
  if (typeof raw === "string" && /^\d+$/.test(raw)) return statusByNumber[raw];
  return raw as TransactionStatus;
}

function leaderReceipt(receipt: ReceiptOutcome): LeaderReceiptEntry | undefined {
  const list = receipt.consensus_data?.leader_receipt;
  if (!list || list.length === 0) return undefined;
  return list.find((entry) => entry.mode === "leader") ?? list[0];
}

function leaderFailed(receipt: ReceiptOutcome): boolean {
  const leader = leaderReceipt(receipt);
  if (!leader) return false;
  const result = String(leader.execution_result ?? "");
  return result === "ERROR"
    || result === "FINISHED_WITH_ERROR"
    || Boolean(leader.error)
    || Boolean(leader.genvm_result?.stderr);
}

export function receiptFailure(receipt: ReceiptOutcome): "undetermined" | "execution" | null {
  const status = receiptStatus(receipt);
  if (status === TransactionStatus.UNDETERMINED) return "undetermined";
  if (status !== TransactionStatus.FINALIZED) return null;

  if (receipt.txExecutionResultName !== undefined) {
    return receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ? null : "execution";
  }
  const leader = leaderReceipt(receipt);
  if (!leader) return "execution";
  return leaderFailed(receipt) ? "execution" : null;
}

async function _finalizedErrorDetail(receipt: ReceiptOutcome): Promise<string> {
  const leader = leaderReceipt(receipt);
  const stderr = leader?.genvm_result?.stderr || leader?.error || "";
  if (stderr) return stderr;
  if (!receipt.hash) return "";
  try {
    const trace = await readClient.debugTraceTransaction({ hash: receipt.hash, round: 0 });
    return trace.stderr || trace.return_data || "";
  } catch {
    return "";
  }
}

const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
export const isRateLimitError = (error: unknown) => /rate limit|too many requests|\b429\b/i.test(String(error instanceof Error ? error.message : error));
export const isTransientRpcError = (error: unknown) => isRateLimitError(error) || /timeout|timed out|fetch failed|network error|bad gateway|service unavailable|gateway timeout|unavailable|\b50[234]\b|not found/i.test(String(error instanceof Error ? error.message : error));

const terminalFailureStatuses = new Set<TransactionStatus>([
  TransactionStatus.UNDETERMINED,
  TransactionStatus.CANCELED,
]);

export async function waitForOutcome(hash: Hash, callbacks: { onAccepted?: () => void; onMonitoringDelay?: (delayed: boolean) => void } = {}, options: { maxWaitMs?: number; pollMs?: number; getTransaction?: () => Promise<ReceiptOutcome>; sleep?: (ms: number) => Promise<unknown>; now?: () => number } = {}) {
  const started = (options.now ?? Date.now)();
  const maxWait = options.maxWaitMs ?? 3_600_000;
  const pollMs = options.pollMs ?? 10_000;
  const pause = options.sleep ?? sleep;
  const now = options.now ?? Date.now;
  const getTransaction = options.getTransaction ?? (() => readClient.getTransaction({ hash }) as Promise<ReceiptOutcome>);
  let accepted = false;
  while (now() - started < maxWait) {
    try {
      const receipt = await getTransaction();
      callbacks.onMonitoringDelay?.(false);
      const status = receiptStatus(receipt);
      if (status !== undefined && terminalFailureStatuses.has(status)) {
        if (status === TransactionStatus.UNDETERMINED) throw new UndeterminedTransactionError();
        throw new Error(`The transaction ended as ${status} before settling; no payout was executed.`);
      }
      if (!accepted && (status === TransactionStatus.ACCEPTED || status === TransactionStatus.FINALIZED)) {
        accepted = true; callbacks.onAccepted?.();
      }
      if (status === TransactionStatus.FINALIZED) {
        const failure = receiptFailure(receipt);
        if (failure === "execution") {
          const detail = await _finalizedErrorDetail({ ...receipt, hash: receipt.hash ?? hash });
          throw new Error(detail || "The finalized transaction was rejected by the contract");
        }
        return receipt;
      }
      await pause(pollMs);
    } catch (error) {
      if (error instanceof UndeterminedTransactionError || !isTransientRpcError(error)) throw error;
      callbacks.onMonitoringDelay?.(true);
      await pause(isRateLimitError(error) ? 30_000 : pollMs);
    }
  }
  throw new TransactionStatusUnavailableError();
}

export function validateContractConfig(config: Record<string, unknown>) {
  if (
    config.release_id !== expectedReleaseId
    || String(config.fee_recipient).toLowerCase() !== "0x23a3bd9d047052318fd51ff6ade53002def9f2fa"
    || Number(config.fee_bps) !== 100
    || Number(config.max_demands) !== 10
    || Number(config.termination_window) !== 172800
  ) {
    throw new Error(`Configured contract does not match the HORKIOS ${networkName} release`);
  }
  return config;
}

let configPromise: Promise<Record<string, unknown>> | undefined;
export async function assertContractConfig() {
  configPromise ??= readClient.readContract({ address: requireContract(), functionName: "get_config", args: [] }).then(value => validateContractConfig(value as Record<string, unknown>)).catch(error => { configPromise = undefined; throw error; });
  return configPromise;
}

export async function nativeBalance(address: Address): Promise<bigint> {
  return await readClient.getBalance({ address }) as bigint;
}

export async function assertFunded(address: Address, required: bigint) {
  const balance = await nativeBalance(address);
  if (balance < required) throw new Error(`Insufficient GEN on ${networkName}: ${balance} wei available, ${required} wei required`);
}

export async function findCampaignByInviteHash(address: Address, inviteHash: string): Promise<number> {
  let cursor = 0;
  while (true) {
    const page = await readClient.readContract({ address: requireContract(), functionName: "get_creator_campaign_ids", args: [address, cursor, 50] }) as Array<number | bigint>;
    for (const rawId of [...page].reverse()) {
      const id = Number(rawId);
      if ((await readCampaign(id)).invite_hash === inviteHash) return id;
    }
    if (page.length < 50) break;
    cursor += page.length;
  }
  throw new Error("The finalized oath could not be matched to its invitation commitment");
}
