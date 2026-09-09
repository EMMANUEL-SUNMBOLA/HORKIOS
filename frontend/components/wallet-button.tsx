"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { truncateAddress } from "@/lib/format";
import { networkName } from "@/lib/contract";
import { useModal } from "@/components/modal";
import { WalletConnectModal } from "@/components/wallet-connect-modal";

const networkLabel =
  networkName === "testnetBradbury"
    ? "Bradbury"
    : networkName === "studionet"
      ? "Studionet"
      : networkName === "localnet"
        ? "Localnet"
        : networkName;

export function WalletButton() {
  const {
    address,
    wrongChain,
    disconnect,
    connecting,
    switching,
    switchError,
    error,
    switchChain,
  } = useWallet();
  const { showModal } = useModal();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function handleConnect() {
    showModal(() => <WalletConnectModal />);
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function handleDisconnect() {
    setOpen(false);
    disconnect();
    router.push("/");
  }

  async function handleSwitch() {
    try {
      await switchChain();
    } catch (caught) {
      console.error("Chain switch failed", caught);
    }
  }

  if (!address)
    return (
      <button
        className="glass-input rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-white/[0.06]"
        onClick={handleConnect}
        disabled={connecting}
        title={error}
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
    );

  if (wrongChain)
    return (
      <div className="relative" ref={menuRef}>
        <button
          className="glass-input flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-amber transition-colors duration-200 hover:bg-white/[0.06]"
          onClick={handleSwitch}
          disabled={switching}
        >
          <span className="h-2 w-2 rounded-full bg-amber horkios-pulse" />
          {switching ? "Switching…" : `Switch to ${networkLabel}`}
        </button>
        {switchError && (
          <div className="absolute right-0 top-full mt-2 rounded-lg border border-destructive/20 bg-black/90 px-3 py-2 text-[12px] text-destructive backdrop-blur-xl">
            {switchError}
          </div>
        )}
      </div>
    );

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="glass-input flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-white/[0.06]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="h-2 w-2 rounded-full bg-green horkios-pulse" />
        {truncateAddress(address)}
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="glass absolute right-0 top-full mt-2 min-w-[200px] p-2" role="menu">
          <div className="border-b border-border/50 px-3 py-2">
            <span className="section-label text-[10px]">
              <span className="section-label-slash">/</span>
              <span className="ml-1">Connected Wallet</span>
            </span>
            <div className="mt-1 font-mono text-[13px] text-foreground">{truncateAddress(address)}</div>
          </div>
          <button
            role="menuitem"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            onClick={copyAddress}
          >
            <span>{copied ? "Address copied" : "Copy address"}</span>
            <span className="text-muted-foreground">{copied ? "✓" : "⎘"}</span>
          </button>
          <button
            role="menuitem"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            onClick={handleDisconnect}
          >
            <span>Disconnect</span>
            <span className="text-muted-foreground">↗</span>
          </button>
        </div>
      )}
    </div>
  );
}
