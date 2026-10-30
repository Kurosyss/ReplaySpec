import { CheckoutForm } from "./CheckoutForm";

type SearchParams = {
  variant?: string;
};

export const metadata = {
  title: "BUG-01 — Checkout Postal Code Validation | ReplaySpec",
  description:
    "Controlled demo for postal-code validation defect. Buggy variant hides error via display:none; fixed variant shows 'Postal code is required.'",
};

export default async function Bug01Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = params.variant ?? "buggy";
  const variant: "buggy" | "fixed" = raw === "fixed" ? "fixed" : "buggy";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              ReplaySpec Demo
            </p>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              BUG-01 — Checkout postal-code validation
            </h1>
          </div>
          <nav aria-label="Variant switcher" className="flex gap-2">
            <a
              href="/demo/bug-01?variant=buggy"
              data-testid="variant-buggy-link"
              aria-current={variant === "buggy" ? "page" : undefined}
              className={
                variant === "buggy"
                  ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
                  : "rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
              }
            >
              Buggy
            </a>
            <a
              href="/demo/bug-01?variant=fixed"
              data-testid="variant-fixed-link"
              aria-current={variant === "fixed" ? "page" : undefined}
              className={
                variant === "fixed"
                  ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
                  : "rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
              }
            >
              Fixed
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-6 py-10">
        <div className="flex w-full max-w-md flex-col">
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Expected behaviour:
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              Submitting without postal code must display &ldquo;Postal code is
              required.&rdquo; Buggy variant reproduces the{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs dark:bg-amber-900">
                display:none
              </code>{" "}
              defect.
            </p>
          </div>

          <CheckoutForm variant={variant} />

          <div
            data-testid="defect-invariant-note"
            className="mt-6 rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs leading-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Invariant for regression test:
            </p>
            <ul className="mt-1 list-disc pl-4">
              <li>
                After clicking <span className="font-mono">Place order</span>{" "}
                with empty postal code, element{" "}
                <span className="font-mono">[data-testid=&quot;postal-error&quot;]</span>{" "}
                must be <strong>visible</strong> and contain &ldquo;Postal code
                is required.&rdquo;
              </li>
              <li>
                The element exists in DOM in both variants; buggy hides it via{" "}
                <span className="font-mono">display:none</span>.
              </li>
            </ul>
          </div>
        </div>

        <aside className="hidden flex-1 flex-col gap-4 lg:flex">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Evidence hints
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                  Buggy selector
                </dt>
                <dd className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  [data-testid=&quot;postal-error&quot;] — hidden
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                  Fixed behaviour
                </dt>
                <dd className="text-xs text-zinc-600 dark:text-zinc-400">
                  Visible error + aria-invalid on input
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                  Stable hook
                </dt>
                <dd className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  data-testid: checkout-form, postal-code-input,
                  checkout-submit, postal-error
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Manual verification
            </h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Keep postal code empty.</li>
              <li>Click &ldquo;Place order&rdquo;.</li>
              <li>Buggy: no visible error (inspect DOM → hidden p#postal-error).</li>
              <li>Fixed: red &ldquo;Postal code is required.&rdquo; visible.</li>
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}
