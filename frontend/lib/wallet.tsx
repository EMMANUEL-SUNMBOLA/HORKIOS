"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Address } from "./types";
import { networkName, expectedChainId, officialChain, writeClient } from "./contract";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

export type { EthereumProvider };

type WalletContextValue = {
  address?: Address;
  chainId?: number;
  wrongChain: boolean;
  connecting: boolean;
  switching: boolean;
  switchError?: string;
  error?: string;
  connect(): Promise<Address | undefined>;
  connectWithProvider(ethProvider: EthereumProvider): Promise<Address | undefined>;
  disconnect(): void;
  ensureNetwork(): Promise<void>;
  switchChain(): Promise<void>;
  clearSwitchError(): void;
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

  const [chainId, setChainId] = useState<number>();

  useEffect(() => {
    const wallet = provider();
    if (!wallet || !address) return;
    let active = true;
    wallet.request({ method: "eth_chainId" }).then((id: unknown) => { if (active) setChainId(parseInt(id as string, 16)); }).catch(() => undefined);
    const listener = (...args: unknown[]) => { if (active) setChainId(parseInt(args[0] as string, 16)); };
    wallet.on?.("chainChanged", listener);
    return () => { active = false; wallet.removeListener?.("chainChanged", listener); setChainId(undefined); };
  }, [address]);

  const connectWithProvider = useCallback(async (ethProvider: EthereumProvider) => {
    setConnecting(true); setError(undefined);
    try {
      const accounts = await ethProvider.request({ method: "eth_requestAccounts" }) as string[];
      const connectedAddress = accounts[0] as Address | undefined;
      setAddress(connectedAddress);
      return connectedAddress;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Wallet connection failed"); return undefined; }
    finally { setConnecting(false); }
  }, []);

  const connect = useCallback(async () => {
    const wallet = provider();
    if (!wallet) { setError("Install MetaMask or another injected wallet to continue"); return undefined; }
    return connectWithProvider(wallet);
  }, [connectWithProvider]);

  const ensureNetwork = useCallback(async () => {
    if (!address) throw new Error("Connect your wallet first");
    await writeClient(address).connect(networkName as "localnet" | "studionet" | "testnetBradbury");
  }, [address]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setChainId(undefined);
    setError(undefined);
  }, []);

  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string>();

  const switchChain = useCallback(async () => {
    const wallet = provider();
    if (!wallet) return;
    const hexId = `0x${expectedChainId.toString(16)}` as `0x${string}`;
    setSwitching(true);
    setSwitchError(undefined);
    try {
      await wallet.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: hexId,
          chainName: officialChain.name,
          rpcUrls: officialChain.rpcUrls.default.http,
          blockExplorerUrls: officialChain.blockExplorers ? [officialChain.blockExplorers.default.url] : [],
          nativeCurrency: officialChain.nativeCurrency,
        }],
      });
    } catch {
      try {
        await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
      } catch (switchErr) {
        const code = (switchErr as { code?: number }).code;
        if (code === 4001) {
          setSwitchError("Switch rejected by user");
        } else {
          setSwitchError(switchErr instanceof Error ? switchErr.message : "Chain switch failed");
        }
      }
    } finally {
      setSwitching(false);
    }
  }, []);

  const clearSwitchError = useCallback(() => setSwitchError(undefined), []);

  const wrongChain = chainId !== undefined && chainId !== expectedChainId;

  const value = useMemo(() => ({ address, chainId, wrongChain, connecting, switching, switchError, error, connect, connectWithProvider, disconnect, ensureNetwork, switchChain, clearSwitchError }), [address, chainId, wrongChain, connecting, switching, switchError, error, connect, connectWithProvider, disconnect, ensureNetwork, switchChain, clearSwitchError]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
