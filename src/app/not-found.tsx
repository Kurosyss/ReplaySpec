import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function NotFound() {
  return (
    <main className="grid min-h-[75vh] place-items-center bg-[var(--canvas)] px-6 text-[var(--text-primary)]">
      <section className="w-full max-w-xl">
        <BrandLogo size="md" showTimestamp={false} />
        <p className="mt-14 font-mono text-xs uppercase tracking-[.2em] text-[var(--accent)]">404 · no matching route</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.05em]">This page isn’t in the record.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">The address may have changed, or the investigation may no longer be available.</p>
        <div className="mt-8 flex gap-3"><Link href="/" className="rounded-full bg-[var(--text-primary)] px-5 py-3 text-xs font-semibold text-[var(--canvas)]">Go to home</Link><Link href="/investigations" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-xs font-semibold">Investigations</Link></div>
      </section>
    </main>
  );
}
