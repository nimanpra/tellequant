const logos = [
  "Briarwood Dental",
  "Northpoint Bank",
  "Helix Clinics",
  "Mason & Co.",
  "Forge Legal",
  "Lakeside Group",
];

export function TrustedBy() {
  return (
    <section className="border-y border-white/[0.04] bg-white/[0.01] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
          Trusted by growing operators
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {logos.map((l) => (
            <span
              key={l}
              className="font-mono text-sm font-medium tracking-tight text-zinc-400"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
