"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy value" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
    >
      {copied ? <Check size={13} strokeWidth={2} aria-hidden="true" /> : <Copy size={13} strokeWidth={1.8} aria-hidden="true" />}
    </button>
  );
}

export function CopyableValue({ value, displayValue, label = "Copy value", className = "" }: { value: string; displayValue: string; label?: string; className?: string }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span className="min-w-0 truncate" title={value}>{displayValue}</span>
      <CopyButton value={value} label={label} />
    </span>
  );
}
