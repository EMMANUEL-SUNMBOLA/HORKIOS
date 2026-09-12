"use client";

import Link from "next/link";
import { AudienceToggle } from "./audience-toggle";
import { AgentGuide } from "./agent-guide";

type HeroSectionProps = {
  audience: "human" | "agent";
  onAudienceChange: (audience: "human" | "agent") => void;
};

export function HeroSection({ audience, onAudienceChange }: HeroSectionProps) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden p-0">
      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1180px] flex-col items-center justify-center px-5 text-center sm:px-8">
        {/* Headline */}
        <h1 className="mb-6 max-w-[800px] font-display text-[48px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[68px] lg:text-[88px]">
          {audience === "human" ? (
            <>
              Make the promise.
              <br />
              Prove the work.
            </>
          ) : (
            <>Onboard your agent.</>
          )}
        </h1>

        {/* Sub-headline */}
        <p className="mb-8 max-w-[520px] text-[16px] leading-[1.5] text-muted-foreground">
          {audience === "human" ? (
            <>
              HORKIOS turns campaign commitments into verifiable oaths funded
              upfront, judged by public evidence, and settled onchain.
            </>
          ) : (
            <>
              Let your agent create, accept, and settle oaths programmatically
              on GenLayer — no manual UI needed.
            </>
          )}
        </p>

        {/* Audience toggle */}
        <div className="mb-8">
          <AudienceToggle audience={audience} onChange={onAudienceChange} />
        </div>

        {/* Agent guide (shown for agent audience) */}
        {audience === "agent" && (
          <div className="mb-8 w-full max-w-[600px]">
            <AgentGuide />
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {audience === "human" ? (
            <>
              {/* First Button: Outline Style (Fills color from Left to Right) */}
              <Link
                className="group relative inline-flex min-h-10 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg border border-primary px-6 py-3 font-medium text-primary transition-colors duration-500 before:absolute before:inset-0 before:start-0 before:w-0 before:bg-primary before:transition-all before:duration-500 hover:before:w-full"
                href="/create"
              >
                <span className="relative z-10 flex items-center gap-2 group-hover:!text-white transition-colors duration-500">
                  Create an oath <span>↗</span>
                </span>
              </Link>

              {/* Second Button: Solid Style (Color leaves through the Right) */}
              <Link
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary bg-primary px-6 py-3 font-medium !text-white transition-colors duration-500 before:absolute before:inset-0 before:start-0 before:w-0 before:bg-white before:transition-all before:duration-500 hover:before:w-full"
                href="/dashboard"
              >
                <span className="relative z-10 flex items-center gap-2 group-hover:!text-primary transition-colors duration-500">
                  Open dashboard
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-lavender px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-[#c8c5e0]"
                href="/how-it-works"
              >
                Read the docs <span>↗</span>
              </Link>
              <Link
                className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium text-foreground transition-colors duration-200 hover:bg-white/[0.06]"
                href="/create"
              >
                Try the UI first
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
