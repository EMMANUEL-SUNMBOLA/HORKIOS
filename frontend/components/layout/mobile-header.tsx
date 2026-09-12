"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletButton } from "@/components/wallet-button";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 md:hidden">
      <div className="flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md">
        <Link className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-.03em] text-foreground" href="/"><span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />HORKIOS</Link>
        <div className="flex items-center gap-2">
          <WalletButton />
          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">{menuOpen ? <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}</svg>
          </button>
        </div>
      </div>
      {menuOpen && <div className="border-b border-border bg-card px-5 py-4 shadow-sm"><nav className="flex flex-col gap-1" aria-label="Mobile navigation">
        {[['How it works', '/how-it-works'], ['Dashboard', '/dashboard'], ['Create oath', '/create']].map(([label, href]) => <Link key={href} className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
      </nav></div>}
    </header>
  );
}
