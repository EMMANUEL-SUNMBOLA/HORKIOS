import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = "", hover = false }: GlassCardProps) {
  return (
    <div
      className={`glass ${hover ? "transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_14px_30px_rgba(16,32,31,.08)]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
