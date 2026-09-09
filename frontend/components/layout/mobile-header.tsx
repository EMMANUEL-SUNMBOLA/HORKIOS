"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletButton } from "@/components/wallet-button";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 md:hidden">
      <div className="flex items-center justify-between border-b border-border bg-black/60 px-5 py-3 backdrop-blur-md">
        <Link
          className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground"
          href="/"
        >
          HORKIOS
        </Link>
        <div className="flex items-center gap-3">
          <WalletButton />
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-black/40 text-muted-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {menuOpen ? (
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-b border-border bg-black/90 px-5 py-4 backdrop-blur-xl">
          <nav className="flex flex-col gap-2">
            <Link
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              href="/how-it-works"
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              href="/create"
              onClick={() => setMenuOpen(false)}
            >
              Create oath
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
