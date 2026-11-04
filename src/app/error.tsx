"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("ReplaySpec route error", error); }, [error]);
  return (
    <main className="grid min-h-[75vh] place-items-center bg-[var(--canvas)] px-6 text-[var(--text-primary)]">
      <section className="w-full max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[.2em] text-[var(--violet)]">Route error · recovery available</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">This view stopped unexpectedly.</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">Try loading the view again or return to the investigation list. If this happened after an upload, check the list before submitting the same recording again.</p>
        {error.digest ? <p className="mt-3 font-mono text-[10px] text-[var(--text-tertiary)]">Reference {error.digest}</p> : null}
        <div className="mt-8 flex gap-3"><button onClick={() => reset()} className="rounded-full bg-[var(--text-primary)] px-5 py-3 text-xs font-semibold text-[var(--canvas)]">Try again</button><Link href="/investigations" className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-xs font-semibold">Investigations</Link></div>
      </section>
    </main>
  );
}
