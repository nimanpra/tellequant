import { cn } from "@/lib/utils";

export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark className="h-7 w-7" />
      {withWord && (
        <span className="text-[15px] font-semibold tracking-tight text-neutral-50">
          Tellequant
        </span>
      )}
    </span>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid place-items-center rounded-lg bg-gradient-to-br from-[#6E7BFF] via-[#4A63F5] to-[#2E3FDB] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_-4px_rgba(62,92,248,0.8)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[55%] w-[55%]"
        aria-hidden="true"
      >
        <path d="M3 12 H7.5 L9.5 7 L12 17 L14.5 9 L16.5 12 H20" />
        <circle cx="20.5" cy="12" r="1.1" fill="white" stroke="none" />
      </svg>
    </span>
  );
}
