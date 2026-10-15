import { createTransactionKit } from "@genlayer/transaction-kit";
import { chain } from "./network";

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

export type ContractWrite = {
  address: `0x${string}`;
  functionName: string;
  args?: unknown[];
  value?: bigint;
};

/**
 * v0.6 submissions carry a fee distribution and value. The transaction kit
 * builds the quote from live network prices and submits the returned
 * distribution unchanged. `allowUnverified` is only set when the operator
 * explicitly opts in for a controlled environment; ordinary flows fail closed
 * on a stale (`mismatch`) fee policy.
 */
const allowUnverified = process.env.NEXT_PUBLIC_ALLOW_UNVERIFIED_FEES === "true";

export async function submitContractWrite(
  request: ContractWrite,
  account: `0x${string}`,
  provider: Eip1193Provider,
): Promise<`0x${string}`> {
  const kit = createTransactionKit({ chain, provider, account, allowUnverified });
  const tx = {
    kind: "write" as const,
    address: request.address,
    method: request.functionName,
    args: request.args ?? [],
  };
  const quote = await kit.estimate({ preset: "standard", userValue: request.value ?? 0n }, tx);
  if (quote.verification.status === "mismatch" && !allowUnverified) {
    throw new Error("The network fee policy changed since this quote was built. Re-estimate before signing.");
  }
  const { genlayerTxId } = await kit.submit(quote, tx);
  return genlayerTxId;
}
