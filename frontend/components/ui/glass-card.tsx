import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = "", hover = false }: GlassCardProps) {
  return (
    <div
      className={`glass ${hover ? "transition-[border-color] duration-150 hover:border-white/[0.15]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
