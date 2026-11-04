export type RunStatus = "queued" | "running" | "completed" | "failed";
export type Verdict = "DEFECT_CONFIRMED" | "REGRESSION_VERIFIED" | "HARNESS_ERROR" | "INCONCLUSIVE";
export type BugId = "BUG-01" | "BUG-02" | "BUG-03";

export type RunRequest = {
  bugId?: BugId;
  variant: "buggy" | "fixed";
  target?: string; // optional, defaults to the selected bundled scenario
};

export type ArtifactMeta = {
  name: string;
  path: string; // relative to run dir, e.g. "screenshot.png"
  mimeType: string;
  bytes: number;
};

export type RunResult = {
  runId: string;
  bugId?: BugId;
  variant: "buggy" | "fixed";
  target: string;
  status: RunStatus;
  verdict: Verdict | null;
  startedAt: string; // ISO
  completedAt: string | null;
  durationMs: number | null;
  error?: string | null;
  artifacts: ArtifactMeta[];
  logs: string[];
};

export const ALLOWED_VARIANTS = ["buggy", "fixed"] as const;
