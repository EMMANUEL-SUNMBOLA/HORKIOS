"use client";

import { faucetFor, type Faucet } from "@/lib/faucet";

/**
 * Modular "get test GEN" affordance. Renders nothing on networks without a
 * faucet. Keeps the faucet link in one place so it can be reused in the wallet
 * menu, the create form, and error banners.
 */
export function WalletFundingLink({ className, label }: { className?: string; label?: string }) {
  const faucet = faucetFor();
  if (!faucet) return null;
  return (
    <a className={className} href={faucet.url} target="_blank" rel="noreferrer">
      {label ?? faucet.label}
    </a>
  );
}

export function useFaucet(): Faucet | undefined {
  return faucetFor();
}
