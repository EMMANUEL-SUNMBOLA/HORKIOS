import { createClient } from "genlayer-js";
import { localnet, studionet, testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { Hash } from "genlayer-js/types";
import type { Address, Campaign } from "./types";

declare global {
  interface Window { ethereum?: unknown; }
}

export const networkName = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "testnetBradbury";
export const contractAddress = process.env.NEXT_PUBLIC_HORKIOS_CONTRACT_ADDRESS as Address | undefined;

const chains = { localnet, studionet, testnetBradbury } as const;
export const chain = chains[networkName as keyof typeof chains] ?? testnetBradbury;
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

export async function waitFinalized(hash: Hash) {
  return readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, retries: 600, interval: 5_000 });
}
