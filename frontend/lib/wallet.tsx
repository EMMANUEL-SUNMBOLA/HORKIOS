"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address } from "./types";
import { networkName, writeClient } from "./contract";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

type WalletContextValue = {
  address?: Address;
  connecting: boolean;
  error?: string;
  connect(): Promise<Address | undefined>;
  disconnect(): void;
  ensureNetwork(): Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function provider(): EthereumProvider | undefined {
  return typeof window === "undefined" ? undefined : window.ethereum as EthereumProvider | undefined;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const wallet = provider();
    if (!wallet) return;
    wallet.request({ method: "eth_accounts" }).then(accounts => {
      const first = (accounts as string[])[0] as Address | undefined;
      setAddress(first);
    }).catch(() => undefined);
    const listener = (...args: unknown[]) => setAddress(((args[0] as string[])?.[0]) as Address | undefined);
    wallet.on?.("accountsChanged", listener);
    return () => wallet.removeListener?.("accountsChanged", listener);
  }, []);

  const connect = useCallback(async () => {
    const wallet = provider();
    if (!wallet) { setError("Install MetaMask or another injected wallet to continue"); return undefined; }
    setConnecting(true); setError(undefined);
    try {
      const accounts = await wallet.request({ method: "eth_requestAccounts" }) as string[];
      const connectedAddress = accounts[0] as Address | undefined;
      setAddress(connectedAddress);
      return connectedAddress;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Wallet connection failed"); return undefined; }
    finally { setConnecting(false); }
  }, []);

  const ensureNetwork = useCallback(async () => {
    if (!address) throw new Error("Connect your wallet first");
    await writeClient(address).connect(networkName as "localnet" | "studionet" | "testnetBradbury");
  }, [address]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setError(undefined);
  }, []);

  const value = useMemo(() => ({ address, connecting, error, connect, disconnect, ensureNetwork }), [address, connecting, error, connect, disconnect, ensureNetwork]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
