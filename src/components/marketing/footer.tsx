import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const columns = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Live demo", href: "/#demo" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    label: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "API reference", href: "/docs/api" },
      { label: "Webhooks", href: "/docs/webhooks" },
      { label: "SDKs", href: "/docs/sdks" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Customers", href: "/customers" },
      { label: "Security", href: "/security" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "DPA", href: "/legal/dpa" },
      { label: "AUP", href: "/legal/aup" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-zinc-400">
            Tellequant is the AI call center for every business. Answer every call, run autonomous
            outbound — backed by your own knowledge base.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.label}>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {c.label}
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-zinc-400">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="transition-colors duration-200 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-zinc-500 sm:flex-row">
          <span>© {new Date().getFullYear()} Tellequant Labs, Inc.</span>
          <span className="font-mono">
            made in the cloud · no customer data used for training
          </span>
        </div>
      </div>
    </footer>
  );
}
