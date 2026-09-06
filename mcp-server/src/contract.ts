import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { privateKeyToAccount } from "viem/accounts";

export const CONTRACT_ADDRESS = process.env.HORKIOS_CONTRACT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000";
export const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
export const NETWORK = process.env.GENLAYER_NETWORK || "testnet-bradbury";

const chains: Record<string, typeof testnetBradbury> = {
  "testnet-bradbury": testnetBradbury,
  "studionet": { ...testnetBradbury, rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } } } as never,
  "localnet": { ...testnetBradbury, rpcUrls: { default: { http: ["http://127.0.0.1:4000/api"] } } } as never,
};

const chain = chains[NETWORK] ?? testnetBradbury;

export const readClient = createClient({ chain });

export function writeClient(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return createClient({ chain, account });
}

export async function readCampaign(id: number) {
  return await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_campaign", args: [id] });
}

export async function readConfig() {
  return await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_config", args: [] });
}

export async function getBalance(address: string) {
  return await readClient.getBalance({ address: address as `0x${string}` });
}

export async function waitForOutcome(hash: `0x${string}` & { length: 66 }, maxWaitMs = 3_600_000) {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    const receipt = await readClient.getTransaction({ hash }) as Record<string, unknown>;
    const status = (receipt.status_name ?? receipt.statusName) as string | undefined;
    const execResult = (receipt.txExecutionResultName ?? receipt.tx_execution_result_name) as string | undefined;
    if (status === TransactionStatus.UNDETERMINED) throw new Error("UNDETERMINED");
    if (status === TransactionStatus.FINALIZED) return receipt;
    if (execResult && execResult !== "NOT_VOTED" && execResult !== "UNINITIALIZED") return receipt;
    await new Promise(r => setTimeout(r, 15_000));
  }
  throw new Error("TIMEOUT");
}
