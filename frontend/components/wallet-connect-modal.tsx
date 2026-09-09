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
    <h2>Connect a wallet</h2>
    <p className="confirm-message wallet-connect-intro">
      Choose a wallet installed in your browser to continue.
    </p>
    {wallets.length === 0 && scanning && (
      <div className="wallet-empty">Detecting wallets…</div>
    )}
    {wallets.length > 0 && (
      <div className="wallet-list">
        {wallets.map(wallet => (
          <button
            key={wallet.rdns}
            className="wallet-option"
            onClick={() => handleConnect(wallet)}
            disabled={connecting !== null}
          >
            {wallet.icon ? (
              <img src={wallet.icon} alt={wallet.name} />
            ) : (
              <span className="wallet-icon-fallback">🦊</span>
            )}
            <span className="wallet-option-name">
              {connecting === wallet.rdns ? "Connecting…" : wallet.name}
            </span>
            <span className="wallet-option-arrow">→</span>
          </button>
        ))}
      </div>
    )}
    {wallets.length === 0 && !scanning && (
      <div className="wallet-empty">
        No wallets detected. Install one to continue:
        <div className="wallet-install">
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">MetaMask</a>
          <a href="https://rabby.io/" target="_blank" rel="noreferrer">Rabby Wallet</a>
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noreferrer">Coinbase Wallet</a>
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
