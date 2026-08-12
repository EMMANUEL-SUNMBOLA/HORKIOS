"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { truncateAddress } from "@/lib/format";

export function WalletButton() {
  const { address, connect, disconnect, connecting, error } = useWallet();
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

  async function handleConnect() {
    const connectedAddress = await connect();
    if (connectedAddress) router.push("/dashboard");
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

  if (!address) return <button className="button secondary wallet" onClick={handleConnect} disabled={connecting} title={error}>
    {connecting ? "Connecting…" : "Connect wallet"}
  </button>;

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
