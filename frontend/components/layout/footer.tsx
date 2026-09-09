import { contractAddress, networkName } from "@/lib/contract";

export function Footer() {
  const network = networkName.toUpperCase();
  const addressDisplay = contractAddress
    ? `${contractAddress.slice(0, 8)}…${contractAddress.slice(-6)}`
    : "CONTRACT NOT SET";

  return (
    <footer className="border-t border-glass-border-subtle px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 sm:flex-row">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          HORKIOS &copy; 2026
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          GENLAYER {network} · {addressDisplay}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
          TEST GEN HAS NO MONETARY VALUE
        </span>
      </div>
    </footer>
  );
}
