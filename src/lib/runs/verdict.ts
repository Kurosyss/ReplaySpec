import type { Verdict } from "./types";

/**
 * Maps BUG-01 execution outcome to product verdict.
 * - Reproduced buggy behaviour (error hidden despite empty postal) -> DEFECT_CONFIRMED
 * - Fixed behaviour passes expected assertion (error visible, then success after fill) -> REGRESSION_VERIFIED
 * - Browser/infrastructure failure -> HARNESS_ERROR
 * - Otherwise INCONCLUSIVE
 */
export function mapBug01ToVerdict(opts: {
  variant: "buggy" | "fixed";
  errorVisible: boolean | null;
  errorHidden: boolean | null;
  errorTextCorrect: boolean | null;
  successVisibleAfterFill: boolean | null;
  harnessError: string | null;
}): Verdict {
  if (opts.harnessError) return "HARNESS_ERROR";

  if (opts.variant === "buggy") {
    // Missing or hidden required feedback both confirm the visible-error defect.
    if (opts.errorHidden === true) return "DEFECT_CONFIRMED";
    if (opts.errorVisible === true) return "INCONCLUSIVE"; // buggy should not show visible error
    return "INCONCLUSIVE";
  }

  if (opts.variant === "fixed") {
    if (opts.errorVisible === true && opts.errorTextCorrect === true && opts.successVisibleAfterFill === true) {
      return "REGRESSION_VERIFIED";
    }
    if (opts.errorVisible === false) return "INCONCLUSIVE";
    return "INCONCLUSIVE";
  }

  return "INCONCLUSIVE";
}
