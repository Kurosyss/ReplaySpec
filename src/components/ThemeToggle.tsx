"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      data-testid="theme-toggle"
      onClick={toggle}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-muted)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <span aria-hidden="true" className="text-[12px] leading-none">
        {theme === "dark" ? "☀" : "☾"}
      </span>
    </button>
  );
}
