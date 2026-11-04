import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

const benchmarks = [
  { id: "bug-01", code: "BUG-01", title: "Postal-code validation", verdict: "REGRESSION VERIFIED", color: "var(--green)" },
  { id: "bug-02", code: "BUG-02", title: "Cart counter race", verdict: "DEFECT CONFIRMED", color: "var(--red)" },
  { id: "bug-03", code: "BUG-03", title: "Modal cancel overlay", verdict: "DEFECT CONFIRMED", color: "var(--red)" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between border-b border-[var(--border-muted)] px-5 py-4 sm:px-8">
        <BrandLogo size="md" showTimestamp={false} />
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
          <Link href="/investigations" className="hidden text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:inline">Investigations</Link>
          <Link href="/privacy" className="hidden text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:inline">Data use</Link>
          <ThemeToggle />
          <Link href="/investigations/new" className="rounded-full bg-[var(--text-primary)] px-4 py-2 text-xs font-semibold text-[var(--canvas)] transition-opacity hover:opacity-80">New investigation</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-20">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Browser defects · evidence · regression</p>
          <h1 className="mt-5 max-w-[620px] text-5xl leading-[0.98] tracking-[-0.055em] text-[var(--text-primary)] sm:text-6xl lg:text-[76px]">
            From bug clip
            <span className="font-display block pt-1 text-[var(--accent)]">to proof.</span>
          </h1>
          <p className="mt-6 max-w-[500px] text-base leading-7 text-[var(--text-secondary)] sm:text-[17px]">
            ReplaySpec turns a browser recording into timestamped evidence, a constrained regression spec, and a real Chromium verdict you can inspect.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/investigations" className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)]">Explore the investigations</Link>
            <Link href="/investigations/new" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]">Analyze a recording</Link>
          </div>
          <p className="mt-5 font-mono text-[10px] text-[var(--text-tertiary)]">Multimodal evidence · evidence-linked · Chromium only</p>
        </div>

        <figure className="overflow-hidden rounded-[24px] border border-[var(--border-muted)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--red)]" />
              BUG-02 <span className="text-[var(--text-tertiary)]">/ frame 00:00.5</span>
            </div>
            <span className="rounded-full border border-[var(--red-muted)] bg-[var(--red-muted)] px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wider text-[var(--red)]">DEFECT CONFIRMED</span>
          </div>
          <div className="relative aspect-[40/29] bg-[var(--canvas)]">
            <Image src="/demo/bug-02/frames/bug02-home.png" alt="Captured BUG-02 cart state at quantity one" fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-contain p-2.5 sm:p-3" />
            <span className="absolute bottom-3 right-3 rounded-full border border-[var(--border-muted)] bg-[var(--surface)]/95 px-2.5 py-1 font-mono text-[9px] text-[var(--text-secondary)]">800 × 580 · browser capture</span>
          </div>
          <figcaption className="grid gap-4 border-t border-[var(--border-muted)] px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Expected invariant</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">Two quick increments must move the cart quantity from 1 to 3.</p>
            </div>
            <Link href="/investigations/bug-02" className="whitespace-nowrap text-xs font-semibold text-[var(--accent)] hover:underline">Inspect evidence →</Link>
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-12 sm:px-8 sm:pb-16">
        <div className="flex flex-col justify-between gap-3 border-t border-[var(--border-muted)] pt-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Curated browser regressions</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Three cases. One inspectable workflow.</h2>
          </div>
          <Link href="/investigations" className="text-xs font-semibold text-[var(--accent)] hover:underline">View all investigations →</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {benchmarks.map((benchmark, index) => (
            <Link key={benchmark.id} href={`/investigations/${benchmark.id}`} className="group rounded-[18px] border border-[var(--border-muted)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">0{index + 1} / {benchmark.code}</span>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: benchmark.color }} aria-hidden="true" />
              </div>
              <p className="mt-4 text-base font-semibold tracking-tight group-hover:text-[var(--accent)]">{benchmark.title}</p>
              <p className="mt-2 font-mono text-[9px] font-semibold tracking-wider" style={{ color: benchmark.color }}>{benchmark.verdict}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-2 border-t border-[var(--border-muted)] px-5 py-5 font-mono text-[10px] text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>ReplaySpec · evidence-grounded regression verification</span>
        <div className="flex gap-4"><Link href="/privacy" className="hover:text-[var(--text-primary)]">Data use</Link><Link href="/terms" className="hover:text-[var(--text-primary)]">Prototype terms</Link></div>
      </footer>
    </main>
  );
}
