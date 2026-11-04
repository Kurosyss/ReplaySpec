"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabId = "recording" | "evidence" | "spec" | "execution";

type NavItemConfig = {
  id: TabId;
  label: string;
  icon: string;
  desc: string;
  navTestId: string;
};

const NAV_ITEMS: NavItemConfig[] = [
  { id: "recording", label: "Recording", icon: "◧", desc: "Frames · Filmstrip", navTestId: "nav-recording" },
  { id: "evidence", label: "Evidence", icon: "≡", desc: "Observations", navTestId: "nav-evidence" },
  { id: "spec", label: "Specification", icon: "⟐", desc: "Assertions", navTestId: "nav-specification" },
  { id: "execution", label: "Execution", icon: "▶", desc: "Verdict & Runs", navTestId: "nav-execution" },
];

export type DetailRailProps = {
  activeTab?: TabId;
  onSelect?: (tab: TabId) => void;
  title?: string;
  bugId?: string;
};

export function DetailLeftRail({
  activeTab = "recording",
  onSelect = () => {},
  title = "BUG-01 Investigation",
  bugId = "BUG-01",
}: DetailRailProps) {
  return (
    <nav
      aria-label="Investigation sections"
      className="hidden w-[200px] shrink-0 flex-col border-r bg-[var(--surface)] lg:flex"
      style={{ borderColor: "var(--border-muted)" }}
    >
      {/* Workspace Header */}
      <div className="border-b px-3.5 py-3.5" style={{ borderColor: "var(--border-muted)" }}>
        <Link
          href="/investigations"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
          <span aria-hidden="true">←</span> Investigations
        </Link>
        <h2
          className="mt-2.5 truncate text-[13px] font-semibold leading-snug tracking-tight text-[var(--text-primary)]"
          title={title}
        >
          {title}
        </h2>
        {bugId ? (
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            <span className="rounded bg-[var(--surface-elevated)] px-1 py-0.2 text-[var(--text-secondary)]">
              {bugId}
            </span>
            <span>· forensic</span>
          </p>
        ) : null}
      </div>

      {/* Navigation items */}
      <div className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`group flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
              style={{
                border: isActive ? "1px solid var(--border-muted)" : "1px solid transparent",
              }}
            >
              <span
                data-testid={item.navTestId}
                aria-hidden="true"
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--text-primary)] text-[var(--canvas)]"
                    : "bg-[var(--surface-elevated)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"
                }`}
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[12px] leading-4 ${
                    isActive ? "font-semibold text-[var(--text-primary)]" : "font-normal"
                  }`}
                >
                  {item.label}
                </span>
                <span className="block font-mono text-[10px] leading-3 text-[var(--text-tertiary)]">
                  {item.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Target Info Footer */}
      <div className="mt-auto p-2.5">
        <div
          className="rounded-[6px] border bg-[var(--surface-elevated)] p-2.5 text-left"
          style={{ borderColor: "var(--border-muted)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              Target
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--green)]" title="Target allowlisted" />
          </div>
          <p className="mt-1 font-mono text-[11px] font-medium text-[var(--text-primary)] truncate">
            /demo/{bugId.toLowerCase()}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            allowlisted · Chromium
          </p>
          <Link
            href={`/demo/${bugId.toLowerCase()}?variant=fixed`}
            className="mt-2 inline-flex w-full items-center justify-center rounded-[5px] border bg-[var(--surface)] px-2 py-1 font-mono text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            style={{ borderColor: "var(--border-muted)" }}
          >
            Open benchmark ↗
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Backwards-compatible export for any component expecting LeftRail
export function LeftRail(props: DetailRailProps) {
  const pathname = usePathname();
  const currentTab: TabId = pathname.includes("evidence")
    ? "evidence"
    : pathname.includes("spec")
      ? "spec"
      : pathname.includes("execution")
        ? "execution"
        : "recording";

  return <DetailLeftRail activeTab={props.activeTab ?? currentTab} {...props} />;
}

export function LeftRailMobile({
  activeTab = "recording",
  onSelect = () => {},
}: {
  activeTab?: TabId;
  onSelect?: (tab: TabId) => void;
}) {
  return (
    <nav
      aria-label="Investigation sections mobile"
      className="flex items-center justify-around border-t bg-[var(--surface)] py-1.5 lg:hidden"
      style={{ borderColor: "var(--border-muted)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            data-testid={`mobile-nav-${item.id}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
              isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-[5px] text-[11px] ${
                isActive
                  ? "bg-[var(--text-primary)] text-[var(--canvas)]"
                  : "bg-[var(--surface-elevated)]"
              }`}
            >
              {item.icon}
            </span>
            <span className="font-mono text-[9px] leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
