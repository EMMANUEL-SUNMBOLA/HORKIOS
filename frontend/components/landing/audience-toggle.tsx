"use client";

type AudienceToggleProps = {
  audience: "human" | "agent";
  onChange: (audience: "human" | "agent") => void;
};

export function AudienceToggle({ audience, onChange }: AudienceToggleProps) {
  return (
    <div
      className="mb-8 inline-flex rounded-full border border-graphite bg-onyx p-[3px]"
      role="tablist"
      aria-label="Audience"
    >
      <button
        role="tab"
        aria-selected={audience === "human"}
        className={`rounded-full px-5 py-2 text-[13px] font-medium tracking-[0.01em] transition-colors duration-200 ease-default ${
          audience === "human"
            ? "bg-copper text-obsidian"
            : "bg-transparent text-fog hover:text-bone"
        }`}
        onClick={() => onChange("human")}
      >
        I&apos;m human
      </button>
      <button
        role="tab"
        aria-selected={audience === "agent"}
        className={`rounded-full px-5 py-2 text-[13px] font-medium tracking-[0.01em] transition-colors duration-200 ease-default ${
          audience === "agent"
            ? "bg-lavender text-obsidian"
            : "bg-transparent text-fog hover:text-bone"
        }`}
        onClick={() => onChange("agent")}
      >
        I&apos;m an agent
      </button>
    </div>
  );
}
