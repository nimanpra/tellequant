# Tellequant Visual Design — Retell-inspired Dark Theme

## Palette (verified from Retell AI brand)
| Token | Hex | Tailwind |
|---|---|---|
| bg-base | `#0A0D14` (slightly deeper than Retell for contrast) | `bg-[#0A0D14]` |
| surface | white/[0.02] | `bg-white/[0.02]` |
| surface-elevated | `#12172180` | `bg-[#121721]/80` |
| border | white/[0.08] | `border-white/[0.08]` |
| border-subtle | white/[0.04] | `border-white/[0.04]` |
| text-primary | `#FAFAFA` | `text-neutral-50` |
| text-secondary | `#A1A1AA` | `text-zinc-400` |
| text-muted | `#71717A` | `text-zinc-500` |
| accent-primary | `#3E5CF8` | `bg-[#3E5CF8]` |
| accent-glow | `#98C9FF` | `text-[#98C9FF]` |

Gradients:
- Hero radial glow: `radial-gradient(60% 50% at 50% 0%, rgba(62,92,248,0.35), transparent 70%)`
- Primary CTA: `linear-gradient(180deg,#5A75FF,#3E5CF8)` + inner highlight `inset 0 1px 0 rgba(255,255,255,0.15)`
- Headline gradient: `bg-gradient-to-b from-white via-white to-[#98C9FF] bg-clip-text text-transparent`

## Typography
- Sans: **Geist** (variable). Mono: **Geist Mono**.
- Display (h1): 56–72px / 600 / tracking -0.03em / leading 1.05
- H2: 40–48px / 600 / -0.02em
- H3: 24–28px / 600
- Body: 16px / 400 / 1.6 in `text-zinc-400`
- Eyebrow: 12–13px / 500 / uppercase / tracking-[0.14em] in `text-[#98C9FF]`

## Radius
- sm 6, md 8, lg 12 (buttons), xl 16, 2xl 20 (cards), pill full

## Motion
- `transition-colors duration-200` on links
- `duration-300 ease-out` on cards
- Hero glow = blurred blue radial div (`blur-3xl opacity-60`) behind headline
- Scroll-in: Framer Motion fade + 8px translate-y `whileInView`

## Voice
Technical, assertive, builder-oriented. Declarative headlines. CTA microcopy is verb-first and low-friction: "Start for free", "Try the live demo", "Book a demo". No exclamation marks.
