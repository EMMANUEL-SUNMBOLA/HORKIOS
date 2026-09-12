"use client";

import Link from "next/link";
import { AudienceToggle } from "./audience-toggle";
import { AgentGuide } from "./agent-guide";

type HeroSectionProps = {
  audience: "human" | "agent";
  onAudienceChange: (audience: "human" | "agent") => void;
};

function OathPreview() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-[720px] text-left" aria-label="HORKIOS oath lifecycle preview">
      <div className="absolute -inset-8 rounded-[40px] bg-[radial-gradient(circle_at_50%_20%,rgba(0,131,125,.18),transparent_60%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-[#bec9c7] bg-white/90 p-4 shadow-[0_24px_70px_rgba(16,32,31,.10)] backdrop-blur sm:p-5">
        <div className="flex items-center justify-between border-b border-[#e8f0ee] px-2 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#176b42] horkios-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[.14em] text-[#3e4948]">Oath in progress</span>
          </div>
          <span className="font-mono text-[11px] text-[#879592]">GENLAYER / BRADBURY</span>
        </div>
        <div className="grid gap-5 px-2 py-5 sm:grid-cols-[1.15fr_.85fr] sm:items-center">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[.13em] text-[#006763]">Successful escrows · 8/10</p>
            <h2 className="font-display text-[24px] font-semibold leading-[1.08] tracking-[-.03em] text-[#171d1c] sm:text-[29px]">A campaign that settles itself.</h2>
            <p className="mt-3 max-w-[440px] text-[14px] leading-6 text-[#596563]">Terms are visible. Evidence is public. Settlement follows the decision, not a middleman.</p>
          </div>
          <div className="relative flex items-center justify-center py-2">
            <svg className="h-36 w-36" viewBox="0 0 144 144" fill="none" aria-hidden="true">
              <circle cx="72" cy="72" r="57" stroke="#d8f2ef" strokeWidth="7" />
              <circle cx="72" cy="72" r="57" stroke="#00837d" strokeWidth="7" strokeLinecap="round" strokeDasharray="80 278" className="horkios-sweep" transform="rotate(-90 72 72)" />
              <circle cx="72" cy="72" r="39" fill="#effaf8" />
              <path d="m62 72 7 7 14-16" stroke="#006763" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute text-center">
              <div className="font-mono text-[21px] font-semibold text-[#006763]">02/04</div>
              <div className="mt-1 text-[11px] text-[#596563]">verified</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 border-t border-[#e8f0ee] px-2 pt-4">
          {["Define", "Fund", "Verify", "Settle"].map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${index < 2 ? "bg-[#006763]" : "bg-[#bec9c7]"}`} />
              <span className="hidden font-mono text-[10px] uppercase tracking-[.08em] text-[#596563] sm:block">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ audience, onAudienceChange }: HeroSectionProps) {
  return (
    <section className="hero-gradient relative -mx-5 overflow-hidden rounded-b-[32px] px-5 pb-16 pt-10 sm:-mx-8 sm:px-8 sm:pb-24 sm:pt-14">
      <div className="mx-auto flex max-w-[920px] flex-col items-center text-center">
        <div className="section-label mb-6"><span className="section-label-slash">/</span> Trustless campaign escrow</div>
        <h1 className="max-w-[900px] font-display text-[48px] font-semibold leading-[.98] tracking-[-.055em] text-foreground sm:text-[70px] lg:text-[88px]">
          {audience === "human" ? <>Make the promise.<br /><span className="text-primary">Prove the work.</span></> : <>Give your agent<br /><span className="text-primary">a verifiable oath.</span></>}
        </h1>
        <p className="mt-7 max-w-[580px] text-[17px] leading-7 text-muted-foreground sm:text-[18px]">
          {audience === "human"
            ? "HORKIOS turns campaign commitments into funded, verifiable oaths. Public evidence in, automatic settlement out."
            : "Let an agent create, accept, and settle programmable oaths on GenLayer with a clear contract lifecycle."}
        </p>
        <div className="mt-8"><AudienceToggle audience={audience} onChange={onAudienceChange} /></div>
        {audience === "agent" && <div className="mb-2 w-full max-w-[600px]"><AgentGuide /></div>}
        <OathPreview />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {audience === "human" ? <>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(0,103,99,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#005753]" href="/create">Create an oath <span aria-hidden="true">↗</span></Link>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent" href="/how-it-works">See how it works</Link>
          </> : <>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(0,103,99,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#005753]" href="/how-it-works">Read the docs <span aria-hidden="true">↗</span></Link>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-accent" href="/create">Try the UI first</Link>
          </>}
        </div>
      </div>
    </section>
  );
}
