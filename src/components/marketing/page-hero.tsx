import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <section className={cn("relative border-b border-white/[0.06] pb-14 pt-8", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(62,92,248,0.15),transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-6 text-center">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#98C9FF]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function ContentSection({
  children,
  className,
  width = "narrow",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "narrow" | "wide";
}) {
  return (
    <section className={cn("py-16", className)}>
      <div
        className={cn(
          "mx-auto px-6",
          width === "narrow" ? "max-w-3xl" : "max-w-5xl",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose-tq text-[15px] leading-relaxed text-zinc-300",
        "[&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-neutral-50",
        "[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-100",
        "[&_p]:mt-4",
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-zinc-400 [&_li]:mt-1.5",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-zinc-400 [&_ol_li]:mt-1.5",
        "[&_a]:text-[#98C9FF] [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-neutral-100",
        "[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/[0.06] [&_pre]:bg-[#07090F] [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[12.5px] [&_pre]:text-zinc-400",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_hr]:my-10 [&_hr]:border-white/[0.06]",
        className,
      )}
    >
      {children}
    </div>
  );
}
