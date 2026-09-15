"use client";

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
      <button
        role="tab"
        aria-selected={audience === "agent"}
        className={`px-5 py-2 text-[13px] font-medium transition duration-200 ${audience === "agent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        onClick={() => onChange("agent")}
      >
        I&apos;m an agent
      </button>
    </div>
  );
}
