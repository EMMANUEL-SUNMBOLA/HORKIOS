interface SectionLabelProps {
  label: string;
  className?: string;
}

export function SectionLabel({ label, className = "" }: SectionLabelProps) {
  return (
    <div className={`section-label ${className}`}>
      <span className="section-label-slash">/</span>
      <span className="ml-1">{label}</span>
    </div>
  );
}
