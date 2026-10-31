import type { EvidenceBundle } from "../evidence";

export type InvestigationStatus = "draft" | "analyzed" | "verified" | "archived";
export type InvestigationVerdict = "DEFECT_CONFIRMED" | "REGRESSION_VERIFIED" | "HARNESS_ERROR" | "INCONCLUSIVE" | null;

export type InvestigationMeta = {
  id: string;
  title: string;
  bugId: string;
  variant: "buggy" | "fixed";
  target: string;
  status: InvestigationStatus;
  verdict: InvestigationVerdict;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  runId: string | null;
  frameCount: number;
  duration: string;
  sourceVideo: string | null; // relative path or null
  specSupportStatus?: "SUPPORTED" | "NEEDS_MAPPING" | "UNSUPPORTED";
  recordingTitle?: string;
  expectedBehaviour?: string;
};

export type InvestigationRecord = {
  meta: InvestigationMeta;
  bundle: EvidenceBundle;
};

export type AssertionMatcher = "toBeVisible" | "toBeHidden" | "toHaveText";

export type SpecAssertion = {
  id: string;
  selector: string; // allowlisted: only "postal-error" in M3.3
  matcher: AssertionMatcher;
  expectedText?: string; // for toHaveText
  observationId: string;
  frameId: string;
  timestamp: string; // mm:ss.s
  timestampSeconds: number;
  createdAt: string;
};

export type SpecData = {
  investigationId: string;
  assertions: SpecAssertion[];
  compiledSource: string | null;
  updatedAt: string | null;
};

export const ALLOWED_SELECTORS = ["postal-error"] as const;
export type AllowedSelector = typeof ALLOWED_SELECTORS[number];

export const ALLOWED_MATCHERS: AssertionMatcher[] = ["toBeVisible", "toBeHidden", "toHaveText"];
