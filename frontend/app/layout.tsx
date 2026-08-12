import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/providers";
import { WalletButton } from "@/components/wallet-button";

export const metadata: Metadata = {
  title: "HORKIOS — Programmable oaths",
  description: "Verifiable work and trustless settlement on GenLayer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="shell">
            <header className="topbar">
              <Link className="brand" href="/">HORKIOS</Link>
              <nav className="nav" aria-label="Primary navigation">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/create">Create oath</Link>
                <WalletButton />
              </nav>
            </header>
            <main className="page">{children}</main>
            <footer className="footer"><span>HORKIOS © 2026</span><span>GENLAYER BRADBURY · PUBLIC TESTNET</span><span>TESTNET GEN HAS NO MONETARY VALUE</span></footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
