import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GenLayerClient, TransactionHash } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";

export default async function main(client: GenLayerClient<unknown>) {
  const feeRecipient = "0x23a3bD9d047052318Fd51ff6ade53002DEF9F2fA";
  const releaseId = "horkios-escrow-2026-08-storage-v2";
  const contractPath = resolve(process.cwd(), "contracts/HorkiosEscrow.py");
  const code = new Uint8Array(readFileSync(contractPath));
  const source = new TextDecoder().decode(code);
  if (source.includes("py-genlayer:latest")) throw new Error("Refusing to deploy an unpinned GenVM dependency");

  await client.initializeConsensusSmartContract();
  const hash = await client.deployContract({ code, args: [] });
  const receipt = await client.waitForTransactionReceipt({ hash: hash as TransactionHash, status: TransactionStatus.FINALIZED, retries: 600, interval: 5_000 });
  const decoded = receipt as unknown as { data?: { contract_address?: string }; txDataDecoded?: { contractAddress?: string } };
  const address = decoded.txDataDecoded?.contractAddress || decoded.data?.contract_address;
  if (!address) throw new Error(`Deployment finalized without a contract address: ${JSON.stringify(receipt)}`);
  const config = await client.readContract({
    address: address as `0x${string}`,
    functionName: "get_config",
    args: [],
  }) as Record<string, unknown>;
  if (
    config.release_id !== releaseId
    || String(config.fee_recipient).toLowerCase() !== feeRecipient.toLowerCase()
    || Number(config.fee_bps) !== 100
    || Number(config.max_demands) !== 10
    || Number(config.termination_window) !== 172800
  ) {
    throw new Error(`Deployment config mismatch: ${JSON.stringify(config)}`);
  }
  const network = String((client as unknown as { chain?: { name?: string } }).chain?.name || "unknown").toLowerCase().replace(/\s+/g, "-");
  const directory = resolve(process.cwd(), "deployments", network);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "HorkiosEscrow.json"), JSON.stringify({ address, transactionHash: hash, feeRecipient, releaseId, deployedAt: new Date().toISOString() }, null, 2));
  return address;
}
