"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { truncateAddress } from "@/lib/format";
import { networkName } from "@/lib/contract";
import { useModal } from "./modal";
import { WalletConnectModal } from "./wallet-connect-modal";

const networkLabel = networkName === "testnetBradbury" ? "Bradbury"
  : networkName === "studionet" ? "Studionet"
  : networkName === "localnet" ? "Localnet"
  : networkName;

export function WalletButton() {
  const { address, wrongChain, disconnect, connecting, switching, switchError, error, switchChain } = useWallet();
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

  if (!address) return <button className="button secondary wallet" onClick={handleConnect} disabled={connecting} title={error}>
    {connecting ? "Connecting…" : "Connect wallet"}
  </button>;

  if (wrongChain) return <div className="wallet-wrong-chain">
    <button className="button secondary wallet wallet-trigger wrong-chain" onClick={handleSwitch} disabled={switching}>
      <span className="wallet-live wrong-chain" />{switching ? "Switching…" : `Switch to ${networkLabel}`}
    </button>
    {switchError && <div className="wallet-switch-error">{switchError}</div>}
  </div>;

  return <div className="wallet-menu" ref={menuRef}>
    <button className="button secondary wallet wallet-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-haspopup="menu">
      <span className="wallet-live" />{truncateAddress(address)}<span className="wallet-chevron">⌄</span>
    </button>
    {open && <div className="wallet-dropdown" role="menu">
      <div className="wallet-dropdown-head"><span>CONNECTED WALLET</span><strong>{truncateAddress(address)}</strong></div>
      <button role="menuitem" onClick={copyAddress}><span>{copied ? "Address copied" : "Copy address"}</span><i>{copied ? "✓" : "□"}</i></button>
      <button role="menuitem" onClick={handleDisconnect}><span>Disconnect</span><i>↗</i></button>
    </div>}
  </div>;
}
