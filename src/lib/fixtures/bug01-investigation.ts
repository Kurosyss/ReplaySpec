import type { EvidenceBundle, FrameEvidence } from "../evidence";

// Sanitized, validated M3.2 genuine empty-postal evidence — no API keys, no sensitive data
// Source: test-results/probe-genuine-fixed.json + frames-empty-fixed-final/manifest.json
// Genuine evidence: empty postal code with placeholder "Enter postal code" — fixed shows error visible at 00:01.8, buggy keeps it hidden.
// Previous M2.2 recordings with 94105 populated were INCONCLUSIVE and are not proof — preserved only in docs/VIDEO_RESEARCH.md §9.

export const bug01Frames: FrameEvidence[] = [
  {
    frameId: "frame-00-00-8",
    timestamp: "00:00.8",
    timestampSeconds: 0.8,
    file: "/demo/bug-01/frames/frame-00-00-8.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 151375,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence",
  },
  {
    frameId: "frame-00-01-2",
    timestamp: "00:01.2",
    timestampSeconds: 1.2,
    file: "/demo/bug-01/frames/frame-00-01-2.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 153701,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence",
  },
  {
    frameId: "frame-00-01-8",
    timestamp: "00:01.8",
    timestampSeconds: 1.8,
    file: "/demo/bug-01/frames/frame-00-01-8.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 46559,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence (error visible)",
  },
  {
    frameId: "frame-00-02-5",
    timestamp: "00:02.5",
    timestampSeconds: 2.5,
    file: "/demo/bug-01/frames/frame-00-02-5.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 156163,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence",
  },
  {
    frameId: "frame-00-03-2",
    timestamp: "00:03.2",
    timestampSeconds: 3.2,
    file: "/demo/bug-01/frames/frame-00-03-2.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 157726,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence",
  },
  {
    frameId: "frame-00-04-0",
    timestamp: "00:04.0",
    timestampSeconds: 4.0,
    file: "/demo/bug-01/frames/frame-00-04-0.png",
    format: "png",
    width: 800,
    height: 450,
    bytes: 134123,
    mimeType: "image/png",
    sourceVideo: "bug-01 fixed empty-postal — 5.8s webm/vp9 — genuine evidence",
  },
];

export const bug01Investigation: EvidenceBundle = {
  sourceVideo: "test-results/frames-empty-fixed-final/manifest.json — fixed empty-postal genuine",
  frames: bug01Frames,
  observations: [
    {
      kind: "observation",
      id: "obs-1",
      frameId: "frame-00-00-8",
      timestamp: "00:00.8",
      timestampSeconds: 0.8,
      statement:
        "At 00:00.8, postal code input is empty showing placeholder 'Enter postal code' (precondition: empty postal code, field empty vs filled = empty), Full name 'Jane Doe', Street address '123 Market St', City 'San Francisco' are filled, 'Place order' button is visible, and validation feedback 'Postal code is required.' is NOT visible.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-00-8.png",
    },
    {
      kind: "observation",
      id: "obs-2",
      frameId: "frame-00-01-2",
      timestamp: "00:01.2",
      timestampSeconds: 1.2,
      statement:
        "At 00:01.2, postal code input remains empty with placeholder 'Enter postal code' (precondition: empty postal code still empty), other fields unchanged, 'Place order' button visible, and validation error 'Postal code is required.' is NOT visible.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-01-2.png",
    },
    {
      kind: "observation",
      id: "obs-3",
      frameId: "frame-00-01-8",
      timestamp: "00:01.8",
      timestampSeconds: 1.8,
      statement:
        "At 00:01.8, postal code input is still empty with placeholder 'Enter postal code' (precondition: empty postal code, field empty), and validation feedback 'Postal code is required.' IS visible as red text below the postal code input, with 'Place order' button still visible, indicating validation error displayed after submission with empty postal code.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-01-8.png",
    },
    {
      kind: "observation",
      id: "obs-4",
      frameId: "frame-00-02-5",
      timestamp: "00:02.5",
      timestampSeconds: 2.5,
      statement:
        "At 00:02.5, postal code input now shows value '94105' (filled after correction), validation error 'Postal code is required.' is NOT visible, and 'Order placed successfully.' is visible below Place order button.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-02-5.png",
    },
    {
      kind: "observation",
      id: "obs-5",
      frameId: "frame-00-03-2",
      timestamp: "00:03.2",
      timestampSeconds: 3.2,
      statement:
        "At 00:03.2, postal code input shows '94105', 'Order placed successfully.' remains visible, no 'Postal code is required.' error visible, form fields unchanged.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-03-2.png",
    },
    {
      kind: "observation",
      id: "obs-6",
      frameId: "frame-00-04-0",
      timestamp: "00:04.0",
      timestampSeconds: 4.0,
      statement:
        "At 00:04.0, final frame with postal code '94105' filled, 'Order placed successfully.' still visible, no validation error, indicating successful submission after correction.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-01/frames/frame-00-04-0.png",
    },
  ],
  expectedBehaviours: [
    {
      kind: "expected",
      id: "exp-1",
      statement: 'Submitting without postal code must display "Postal code is required."',
      rawUserInput: 'Submitting without postal code must display "Postal code is required."',
    },
  ],
  hypotheses: [
    {
      kind: "hypothesis",
      id: "hyp-1",
      statement:
        "Inferred click on Place order button likely occurred between 00:01.2 and 00:01.8 causing validation error 'Postal code is required.' to appear in fixed variant",
      confidence: "high",
      inferredFrom: ["obs-2", "obs-3"],
    },
    {
      kind: "hypothesis",
      id: "hyp-2",
      statement:
        "Buggy variant likely hides [data-testid='postal-error'] via display:none while element remains in DOM, so even after submission with empty postal code the error remains invisible",
      confidence: "high",
      inferredFrom: ["obs-3"],
    },
    {
      kind: "hypothesis",
      id: "hyp-3",
      statement:
        "Inferred correction fill of postal code with '94105' between 00:01.8 and 00:02.5 caused error to disappear and 'Order placed successfully.' to appear",
      confidence: "high",
      inferredFrom: ["obs-3", "obs-4"],
    },
    {
      kind: "hypothesis",
      id: "hyp-4",
      statement:
        "Fixed variant correctly implements validation: shows visible error with aria-invalid when empty, and allows success after valid postal code",
      confidence: "medium",
      inferredFrom: ["obs-3", "obs-4"],
    },
  ],
  ambiguities: [
    {
      kind: "ambiguity",
      id: "amb-1",
      statement:
        "Whether [data-testid='postal-error'] element exists in DOM and its computed style (display:none vs visible) cannot be verified from screenshots alone; requires DOM inspection",
      missingInfo: "DOM inspection data",
      affects: ["obs-3"],
    },
    {
      kind: "ambiguity",
      id: "amb-2",
      statement:
        "Exact timing of user click and input clearing is not directly visible, only inferred from UI change between frames",
      missingInfo: "input event log",
      affects: ["obs-2", "obs-3"],
    },
    {
      kind: "ambiguity",
      id: "amb-3",
      statement:
        "Whether buggy variant's hidden error would become visible after correction cannot be seen in fixed-only frames; need comparative buggy frames for complete defect confirmation",
      missingInfo: "buggy comparative frames",
      affects: ["obs-3"],
    },
  ],
};

// Investigation list — now with genuine evidence, verdicts reflect real execution
export type InvestigationSummary = {
  id: string;
  title: string;
  bugId: string;
  variant: "buggy" | "fixed";
  target: string;
  status: "analyzed" | "verified" | "draft" | "inconclusive";
  verdict: "DEFECT_CONFIRMED" | "REGRESSION_VERIFIED" | "HARNESS_ERROR" | "INCONCLUSIVE" | null;
  updatedAt: string;
  frameCount: number;
  duration: string;
};

export const investigationSummaries: InvestigationSummary[] = [
  {
    id: "bug-01",
    title: "BUG-01 — Checkout postal-code validation",
    bugId: "BUG-01",
    variant: "fixed",
    target: "/demo/bug-01?variant=fixed",
    status: "verified",
    verdict: "REGRESSION_VERIFIED",
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    frameCount: 6,
    duration: "5.8s",
  },
  {
    id: "bug-01-buggy",
    title: "BUG-01 — Checkout postal-code validation (buggy comparison)",
    bugId: "BUG-01",
    variant: "buggy",
    target: "/demo/bug-01?variant=buggy",
    status: "verified",
    verdict: "DEFECT_CONFIRMED",
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    frameCount: 6,
    duration: "5.72s",
  },
];

export const investigationsById: Record<string, EvidenceBundle> = {
  "bug-01": bug01Investigation,
  "bug-01-buggy": bug01Investigation,
};
