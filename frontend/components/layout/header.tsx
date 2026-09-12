import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 mx-auto max-w-[1180px] px-5 sm:px-8 max-[900px]:hidden">
      <div className="glass-nav flex items-center justify-between px-5 py-2.5 shadow-[0_8px_24px_rgba(16,32,31,.06)]">
        <Link className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-.03em] text-foreground" href="/">
          HORKIOS
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <Link className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" href="/how-it-works">How it works</Link>
          <Link className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" href="/dashboard">Dashboard</Link>
          <Link className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" href="/create">Create oath</Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
