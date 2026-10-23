type FluidBackdropProps = {
  className?: string;
};

export function FluidBackdrop({ className = "" }: FluidBackdropProps) {
  return (
    <div
      className={`fluid-backdrop ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="topographic-surface" />
      <div className="print-grain" />
    </div>
  );
}
