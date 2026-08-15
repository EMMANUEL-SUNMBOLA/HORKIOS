import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";
import type { Hash } from "genlayer-js/types";
import type { Address, Campaign } from "./types";
import { hostedRpcUpstream, RPC_RELAY_PATH } from "./rpc-relay";

declare global {
  interface Window { ethereum?: unknown; }
}

export const networkName = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet";
export const contractAddress = process.env.NEXT_PUBLIC_HORKIOS_CONTRACT_ADDRESS as Address | undefined;
export const expectedReleaseId = "horkios-escrow-2026-08-storage-v2";

const chains = { localnet, studionet, testnetBradbury } as const;
const officialChain = chains[networkName as keyof typeof chains] ?? studionet;
const browserRpc = hostedRpcUpstream(networkName) ? RPC_RELAY_PATH : officialChain.rpcUrls.default.http[0];
export const chain = {
  ...officialChain,
  rpcUrls: {
    ...officialChain.rpcUrls,
    default: { ...officialChain.rpcUrls.default, http: [browserRpc] },
  },
};
export const readClient = createClient({ chain });

export function writeClient(address: Address) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("A browser wallet is required");
  return createClient({ chain, account: address, provider: window.ethereum });
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
  genvm_result?: { stderr?: string };
  result?: unknown;
};

export type ReceiptOutcome = {
  hash?: Hash;
  status_name?: TransactionStatus;
  statusName?: TransactionStatus;
  txExecutionResultName?: ExecutionResult;
  consensus_data?: { leader_receipt?: LeaderReceiptEntry[] };
};

function leaderReceipt(receipt: ReceiptOutcome): LeaderReceiptEntry | undefined {
  const list = receipt.consensus_data?.leader_receipt;
  if (!list || list.length === 0) return undefined;
  return list.find((entry) => entry.mode === "leader") ?? list[0];
}

function leaderFailed(receipt: ReceiptOutcome): boolean {
  const leader = leaderReceipt(receipt);
  if (!leader) return false;
  return String(leader.execution_result) === "ERROR" || Boolean(leader.genvm_result?.stderr);
}

export function receiptFailure(receipt: ReceiptOutcome): "undetermined" | "execution" | null {
  const status = receipt.status_name ?? receipt.statusName;
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
  const stderr = leader?.genvm_result?.stderr || "";
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
export const isTransientRpcError = (error: unknown) => isRateLimitError(error) || /timeout|timed out|fetch failed|network error|bad gateway|service unavailable|gateway timeout|\b50[234]\b|not found/i.test(String(error instanceof Error ? error.message : error));

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
      const status = receipt.status_name ?? receipt.statusName;
      if (status === TransactionStatus.UNDETERMINED) throw new UndeterminedTransactionError();
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

export async function assertFunded(address: Address, required: bigint) {
  const balance = await readClient.getBalance({ address });
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
