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
    <section className=" min-h-[100svh] overflow-hidden p-0">
      {/* Hero gradient band */}
      <div className="hero-gradient absolute inset-0" />

      {/* Animated background SVG — spans full width */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vertical grid lines */}
          {Array.from({ length: 40 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1="0"
              x2={i * 50}
              y2="1080"
              stroke="white"
              strokeWidth="0.5"
              className="horkios-dash"
              style={{ strokeDasharray: "4 4", animationDelay: `${i * 0.05}s` }}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: 22 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 50}
              x2="1920"
              y2={i * 50}
              stroke="white"
              strokeWidth="0.5"
              className="horkios-dash"
              style={{ strokeDasharray: "4 4", animationDelay: `${i * 0.05}s` }}
            />
          ))}
          {/* Decorative circles */}
          <circle
            cx="960"
            cy="540"
            r="200"
            stroke="white"
            strokeWidth="0.5"
            className="horkios-draw"
          />
          <circle
            cx="960"
            cy="540"
            r="300"
            stroke="white"
            strokeWidth="0.3"
            className="horkios-draw"
            style={{ animationDelay: "0.3s" }}
          />
          <circle
            cx="960"
            cy="540"
            r="400"
            stroke="white"
            strokeWidth="0.2"
            className="horkios-draw"
            style={{ animationDelay: "0.6s" }}
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1180px] flex-col items-center justify-center px-5 text-center sm:px-8">
        {/* Headline */}
        <h1 className="mb-6 max-w-[800px] font-display text-[48px] font-semibold leading-[1.05] tracking-[-0.03em] text-bone sm:text-[68px] lg:text-[88px]">
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
        <p className="mb-8 max-w-[520px] text-[16px] leading-[1.5] text-fog">
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
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full  px-6 py-3 text-[14px] font-medium transition-all duration-200 "
                href="/create"
              >
                Create an oath <span>↗</span>
              </Link>
              <Link
                className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium text-bone transition-colors duration-200 hover:bg-white/[0.06]"
                href="/dashboard"
              >
                Open dashboard
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
                className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium text-bone transition-colors duration-200 hover:bg-white/[0.06]"
                href="/create"
              >
                Try the UI first
              </Link>
            </>
          )}
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <span className="section-label text-[10px]">
            <span className="section-label-slash">/</span>
            <span className="ml-1">Verifiable Agreements</span>
          </span>
        </div>
      </div>
    </section>
  );
}
