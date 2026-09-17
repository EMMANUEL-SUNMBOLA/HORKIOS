import { contractAddress, networkName } from "@/lib/contract";
import { CopyableValue } from "@/components/ui/copy-button";
import { truncateHash } from "@/lib/format";

export function Footer() {
  const network = networkName.toUpperCase();
  const addressDisplay = contractAddress ? `${contractAddress.slice(0, 8)}…${contractAddress.slice(-6)}` : "CONTRACT NOT SET";

  return (
    <footer className="border-t border-border/70 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:py-8">
      <div className="mx-auto grid max-w-[1180px] gap-3 text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
        <span className="font-mono text-[10px] leading-5 tracking-[.1em] text-muted-foreground sm:text-[11px] sm:tracking-[.14em]">
          HORKIOS &copy; 2026
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] leading-5 tracking-[.1em] text-muted-foreground sm:text-[11px] sm:tracking-[.14em]">
          <span>GENLAYER {network}</span>
          <span aria-hidden="true">·</span>
          {contractAddress ? <CopyableValue value={contractAddress} displayValue={truncateHash(contractAddress)} label="Copy contract address" /> : <span>{addressDisplay}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] leading-5 tracking-[.1em] text-muted-foreground sm:text-[11px] sm:tracking-[.14em]">
          <a className="inline-flex min-h-11 items-center py-2 transition-colors hover:text-primary" href="https://t.me/caveman_xx" target="_blank" rel="noreferrer">CONTACT</a>
          <span>TEST GEN HAS NO MONETARY VALUE</span>
        </div>
      </div>
    </footer>
  );
}
