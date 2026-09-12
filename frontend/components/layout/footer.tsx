import { contractAddress, networkName } from "@/lib/contract";
import { CopyableValue } from "@/components/ui/copy-button";
import { truncateHash } from "@/lib/format";

export function Footer() {
  const network = networkName.toUpperCase();
  const addressDisplay = contractAddress
    ? `${contractAddress.slice(0, 8)}…${contractAddress.slice(-6)}`
    : "CONTRACT NOT SET";

  return (
    <footer className="border-t border-border/50 px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 sm:flex-row">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          HORKIOS &copy; 2026
        </span>
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          GENLAYER {network} · {contractAddress ? <CopyableValue value={contractAddress} displayValue={truncateHash(contractAddress)} label="Copy contract address" /> : addressDisplay}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          TEST GEN HAS NO MONETARY VALUE
        </span>
      </div>
    </footer>
  );
}
