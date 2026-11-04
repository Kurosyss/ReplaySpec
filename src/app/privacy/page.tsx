import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-[var(--border-muted)] px-5 py-4 sm:px-8">
        <Link href="/" aria-label="ReplaySpec home"><BrandLogo size="md" showTimestamp={false} /></Link>
        <div className="flex items-center gap-4"><Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link><ThemeToggle /></div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[var(--accent)]">Data handling · prototype</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">What happens to a recording</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">ReplaySpec is a hackathon prototype for investigating browser defects. Do not upload confidential recordings, credentials, payment details, or personal information.</p>
        <div className="mt-10 space-y-8 border-t border-[var(--border-muted)] pt-7">
          <section><h2 className="text-lg font-semibold">Data you provide</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">An uploaded MP4 or WebM recording, its title, expected behaviour, and optional technical context are stored by the server in the project’s local test-results directory. The prototype does not provide user accounts or a persistent hosted database.</p></section>
          <section><h2 className="text-lg font-semibold">Model analysis</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">For analysis, the server extracts a limited set of still frames and sends those images with your title, expected behaviour, and optional context to the configured vision-model provider. The default provider is selected by server configuration. Provider terms and retention practices apply to data they receive; check the provider’s current terms before using real or sensitive recordings.</p></section>
          <section><h2 className="text-lg font-semibold">Storage and deletion</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">This prototype does not currently offer an in-product deletion control, account-based access, or a hosted retention policy. Local development files remain on the machine running the app until its operator removes them. Do not expose this prototype publicly with real user recordings.</p></section>
          <section><h2 className="text-lg font-semibold">Payments and orders</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">The MAISON benchmark is a demonstration fixture. It does not place real orders, collect payments, or send confirmation emails.</p></section>
          <section><h2 className="text-lg font-semibold">Questions</h2><p className="mt-2 leading-7 text-[var(--text-secondary)]">This prototype has no public support or privacy contact channel. For a demo deployment, ask its operator how to remove locally stored test data.</p></section>
        </div>
        <div className="mt-12 flex flex-wrap gap-3"><Link href="/investigations/new" className="rounded-full bg-[var(--accent)] px-5 py-3 text-xs font-semibold text-white">New investigation</Link><Link href="/terms" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-xs font-semibold">Prototype terms</Link></div>
        <p className="mt-10 font-mono text-[10px] text-[var(--text-tertiary)]">Last reviewed: 3 November 2026 · Prototype disclosure, not legal advice.</p>
      </article>
    </main>
  );
}
