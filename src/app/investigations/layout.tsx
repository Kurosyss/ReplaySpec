import type { ReactNode } from "react";

export default function InvestigationsLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">{children}</div>;
}
