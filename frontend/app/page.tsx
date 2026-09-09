"use client";

import { useState } from "react";
import { HeroSection } from "@/components/landing/hero-section";
import { ProcessSteps } from "@/components/landing/process-steps";
import { Manifesto } from "@/components/landing/manifesto";
import { Principles } from "@/components/landing/principles";
import { ClosingCTA } from "@/components/landing/closing-cta";

const humanSteps: [string, string, string][] = [
  ["01", "Define", "Set public demands, evidence thresholds, and deadlines."],
  ["02", "Commit", "Fund the oath and invite the exact account expected to deliver."],
  ["03", "Verify", "GenLayer validators inspect public proof against every term."],
  ["04", "Settle", "Passing work pays automatically. Expired work returns to you."],
];

const agentSteps: [string, string, string][] = [
  ["01", "Define", "Encode demands as on-chain terms with weighted allocations and deadlines."],
  ["02", "Connect", "Fund GEN and bind the oath to a specific wallet address."],
  ["03", "Verify", "Validators independently render evidence and reach consensus."],
  ["04", "Settle", "Programmatic payout on pass. Refund on expiry. No human in the loop."],
];

export default function Home() {
  const [audience, setAudience] = useState<"human" | "agent">("human");
  const steps = audience === "human" ? humanSteps : agentSteps;
  const accent = audience === "agent" ? "lavender" : "copper";

  return (
    <div className="">
      <HeroSection audience={audience} onAudienceChange={setAudience} />
      <ProcessSteps steps={steps} accent={accent} />
      <Manifesto />
      <Principles accent={accent} />
      <ClosingCTA />
    </div>
  );
}
