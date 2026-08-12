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

export async function waitAccepted(hash: Hash) {
  return readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, retries: 240, interval: 3_000 });
}

export class UndeterminedTransactionError extends Error {
  constructor() { super("Validators could not agree. No contract state or funds changed; retry when the evidence source is stable."); }
}

type ReceiptOutcome = { statusName?: TransactionStatus; txExecutionResultName?: ExecutionResult };

export function receiptFailure(receipt: ReceiptOutcome): "undetermined" | "execution" | null {
  if (receipt.statusName === TransactionStatus.UNDETERMINED) return "undetermined";
  if (receipt.statusName === TransactionStatus.FINALIZED && receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) return "execution";
  return null;
}

export async function waitForOutcome(hash: Hash, onAccepted?: () => void) {
  const accepted = await waitAccepted(hash);
  if (receiptFailure(accepted) === "undetermined") throw new UndeterminedTransactionError();
  onAccepted?.();
  const receipt = await readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, retries: 600, interval: 5_000 });
  const failure = receiptFailure(receipt);
  if (failure === "undetermined") throw new UndeterminedTransactionError();
  if (failure === "execution") {
    let detail = "The finalized transaction was rejected by the contract";
    try {
      const trace = await readClient.debugTraceTransaction({ hash, round: 0 });
      detail = trace.stderr || trace.return_data || detail;
    } catch { /* preserve the receipt-level error */ }
    throw new Error(detail);
  }
  return receipt;
}

export async function assertContractConfig() {
  const config = await readClient.readContract({ address: requireContract(), functionName: "get_config", args: [] }) as Record<string, unknown>;
  if (Number(config.fee_bps) !== 100 || Number(config.max_demands) !== 10 || Number(config.termination_window) !== 172800) {
    throw new Error(`Configured contract does not match the HORKIOS ${networkName} release`);
  }
  return config;
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
