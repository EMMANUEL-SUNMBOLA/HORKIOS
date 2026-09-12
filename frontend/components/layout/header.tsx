import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-5 z-50 mx-auto max-w-[1180px] px-5 sm:px-8 max-[900px]:hidden">
      <div className="border rounded-lg bg-black/10 flex items-center justify-between px-6 py-3">
        <Link
          className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground"
          href="/"
        >
          HORKIOS
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <Link
            className="rounded-sm px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 ease-default hover:bg-white/[0.5] hover:text-foreground"
            href="/how-it-works"
          >
            How it works
          </Link>
          <Link
            className="rounded-sm px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 ease-default hover:bg-white/[0.5] hover:text-foreground"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-sm px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 ease-default hover:bg-white/[0.5] hover:text-foreground"
            href="/create"
          >
            Create oath
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
