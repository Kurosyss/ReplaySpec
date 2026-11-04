import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-[var(--border-muted)] px-5 py-4 sm:px-8">
        <Link href="/" aria-label="ReplaySpec home"><BrandLogo size="md" showTimestamp={false} /></Link>
        <div className="flex items-center gap-4"><Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link><ThemeToggle /></div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">Terms · prototype</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">A research demonstration</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">ReplaySpec is provided as an experimental hackathon prototype. It is not a production service and is offered without guarantees of availability, accuracy, or fitness for a particular purpose.</p>
        <div className="mt-10 space-y-8 border-t border-[var(--border-muted)] pt-7">
          <section><h2 className="text-lg font-semibold">Use and responsibility</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">Use only recordings and test targets you are authorized to use. Do not upload secrets, personal data, or material you do not have permission to share. Model-generated observations can be wrong; inspect their linked evidence and verify generated assertions before relying on them.</p></section>
          <section><h2 className="text-lg font-semibold">Demo-only commerce</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">The MAISON pages simulate checkout interactions. They do not process a payment, create a real order, or contact a merchant. Product names, prices, shipping details, and confirmations are illustrative.</p></section>
          <section><h2 className="text-lg font-semibold">Third-party services</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">Optional model analysis sends extracted frames and supplied prompt context to the configured model provider. You are responsible for reviewing that provider’s current terms and access requirements.</p></section>
          <section><h2 className="text-lg font-semibold">Availability and changes</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">Features, test fixtures, and provider availability may change during development. No production support, account recovery, or service-level commitment is provided.</p></section>
        </div>
        <div className="mt-12 flex flex-wrap gap-3"><Link href="/" className="rounded-full bg-[var(--accent)] px-5 py-3 text-xs font-semibold text-white">Back to ReplaySpec</Link><Link href="/privacy" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-xs font-semibold">Data use</Link></div>
        <p className="mt-10 font-mono text-[10px] text-[var(--text-tertiary)]">Last reviewed: 3 November 2026 · Prototype disclosure, not legal advice.</p>
      </article>
    </main>
  );
}
