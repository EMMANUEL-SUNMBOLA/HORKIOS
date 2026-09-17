"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type AudienceToggleProps = {
  audience: "human" | "agent";
  onChange: (audience: "human" | "agent") => void;
};

export function AudienceToggle({ audience, onChange }: AudienceToggleProps) {
  return (
    <div
      className="inline-flex border border-border bg-card p-1 shadow-sm"
      role="tablist"
      aria-label="Choose your audience"
    >
      <button
        role="tab"
        aria-selected={audience === "human"}
        className={`px-5 py-2 text-[13px] font-medium transition duration-200 ${audience === "human" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => onChange("human")}
      >
        I&apos;m human
      </button>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              role="tab"
              aria-selected={audience === "agent"}
              aria-disabled
              disabled
              className="px-5 py-2 text-[13px] font-medium transition duration-200 text-muted-foreground opacity-50 cursor-not-allowed"
            />
          }
        >
          I&apos;m an agent
        </TooltipTrigger>
        <TooltipContent>Coming soon</TooltipContent>
      </Tooltip>
    </div>
  );
}
