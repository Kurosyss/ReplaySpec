"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
type NavItem = { label: string; href: string; icon: string; activePrefix: string };
const NAV: NavItem[] = [
  { label: "Recording", href: "/investigations/bug-01", icon: "◧", activePrefix: "/investigations/bug-01$" },
  { label: "Evidence", href: "/investigations/bug-01#evidence", icon: "≡", activePrefix: "evidence" },
  { label: "Specification", href: "/investigations/bug-01#spec", icon: "⟐", activePrefix: "spec" },
  { label: "Execution", href: "/investigations/bug-01#execution", icon: "▶", activePrefix: "execution" },
];
export function LeftRail() {
  const pathname = usePathname();
  return (
    <nav aria-label="Investigation sections" className="hidden w-[200px] shrink-0 flex-col border-r bg-[var(--surface)] py-4 lg:flex" style={{ borderColor: "var(--border-muted)" }}>
      <div className="px-3 pb-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Workspace</p>
        <p className="mt-1 text-[13px] font-medium leading-4 text-[var(--text-primary)]">BUG-01 Investigation</p>
        <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">Checkout validation</p>
      </div>
      <ul className="flex flex-col gap-0.5 px-2">
        {NAV.map((item) => {
          const isActive = item.label === "Recording" ? pathname === "/investigations/bug-01" : pathname.includes(item.activePrefix) || false;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase()}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] leading-4 ${isActive ? "bg-[var(--surface-elevated)] font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"}`}
              >
                <span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-[6px] text-[11px] ${isActive ? "bg-[var(--text-primary)] text-[var(--canvas)]" : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)]"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto px-3 pt-4">
        <div className="rounded-[8px] border bg-[var(--surface-elevated)] p-3" style={{ borderColor: "var(--border-muted)" }}>
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Target</p>
          <p className="mt-1 font-mono text-[11px] font-medium leading-4 text-[var(--text-primary)]">/demo/bug-01</p>
          <p className="font-mono text-[11px] leading-4 text-[var(--text-tertiary)]">allowlisted · Chromium only</p>
          <Link href="/demo/bug-01?variant=fixed" className="mt-2 inline-flex w-full justify-center rounded-[6px] bg-[var(--text-primary)] px-2 py-1.5 font-mono text-[11px] font-medium text-[var(--canvas)] hover:opacity-90">
            Open target →
          </Link>
        </div>
      </div>
    </nav>
  );
}
export function LeftRailMobile() {
  return (
    <nav aria-label="Investigation sections mobile" className="flex items-center justify-around border-t bg-[var(--surface)] py-2 lg:hidden" style={{ borderColor: "var(--border-muted)" }}>
      {NAV.map((item) => (
        <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 px-2 py-1 text-[var(--text-tertiary)]">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--surface-elevated)] font-mono text-[11px]">{item.icon}</span>
          <span className="font-mono text-[10px] leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
