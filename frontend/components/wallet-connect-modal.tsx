/* eslint-disable @next/next/no-img-element -- wallet icons from EIP-6963 are data URIs */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useModal } from "@/components/modal";
import { useWallet, type EthereumProvider } from "@/lib/wallet";
import { useRouter } from "next/navigation";

type DetectedWallet = {
  name: string;
  icon: string;
  rdns: string;
  provider: EthereumProvider;
};

type WalletInfo = {
  info: { name: string; icon: string; rdns: string };
  provider: EthereumProvider;
};

const WALLET_SCAN_MS = 600;

export function WalletConnectModal({ onSuccess }: { onSuccess?: () => void }) {
  const { hideModal } = useModal();
  const { connectWithProvider } = useWallet();
  const router = useRouter();
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const seen = useRef(new Set<string>());

  const handleAnnounce = useCallback((event: Event) => {
    const { info, provider } = (event as CustomEvent<WalletInfo>).detail;
    if (!info?.rdns || seen.current.has(info.rdns)) return;
    seen.current.add(info.rdns);
    setWallets(prev => [...prev, { name: info.name, icon: info.icon, rdns: info.rdns, provider }]);
  }, []);

  useEffect(() => {
    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const timer = setTimeout(() => {
      setScanning(false);
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);

      if (seen.current.size === 0 && typeof window !== "undefined" && window.ethereum) {
        const eth = window.ethereum as EthereumProvider;
        setWallets([{
          name: detectWalletName(eth),
          icon: "",
          rdns: "browser-wallet",
          provider: eth,
        }]);
      }
    }, WALLET_SCAN_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    };
  }, [handleAnnounce]);

  async function handleConnect(wallet: DetectedWallet) {
    setConnecting(wallet.rdns);
    const address = await connectWithProvider(wallet.provider);
    setConnecting(null);
    if (address) {
      hideModal();
      onSuccess?.();
      router.push("/dashboard");
    }
  }

  return <>
    <h2 className="mt-0 pr-8 font-display text-[22px] font-semibold tracking-[-0.02em] text-foreground">
      Connect a wallet
    </h2>
    <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">
      Choose a wallet installed in your browser to continue.
    </p>
    {wallets.length === 0 && scanning && (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-8 text-center text-muted-foreground">
        <span className="horkios-pulse mr-2.5 inline-block h-1.5 w-1.5 rounded-full bg-green" />
        Detecting wallets…
      </div>
    )}
    {wallets.length > 0 && (
      <div className="mt-4 grid gap-2">
        {wallets.map(wallet => (
          <button
            key={wallet.rdns}
            className="glass-input flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
            onClick={() => handleConnect(wallet)}
            disabled={connecting !== null}
          >
            {wallet.icon ? (
              <img className="size-8 rounded-lg" src={wallet.icon} alt={wallet.name} />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-[18px]">🦊</span>
            )}
            <span className="flex-1 text-[14px] font-medium text-foreground">
              {connecting === wallet.rdns ? "Connecting…" : wallet.name}
            </span>
            <span className="text-muted-foreground">→</span>
          </button>
        ))}
      </div>
    )}
    {wallets.length === 0 && !scanning && (
      <div className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
        No wallets detected. Install one to continue:
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="glass-input rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]" href="https://metamask.io/download/" target="_blank" rel="noreferrer">MetaMask</a>
          <a className="glass-input rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]" href="https://rabby.io/" target="_blank" rel="noreferrer">Rabby Wallet</a>
          <a className="glass-input rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]" href="https://www.coinbase.com/wallet" target="_blank" rel="noreferrer">Coinbase Wallet</a>
        </div>
      </div>
    )}
  </>;
}

function detectWalletName(eth: EthereumProvider): string {
  const any = eth as Record<string, unknown>;
  if (any.isMetaMask) return "MetaMask";
  if (any.isRabby) return "Rabby Wallet";
  if (any.isCoinbaseWallet) return "Coinbase Wallet";
  if (any.isTrust) return "Trust Wallet";
  return "Browser Wallet";
}
