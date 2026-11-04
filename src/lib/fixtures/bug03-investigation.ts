import type { EvidenceBundle, FrameEvidence } from "../evidence";

export const bug03Frames: FrameEvidence[] = [
  {
    frameId: "frame-00-00-4",
    timestamp: "00:00.4",
    timestampSeconds: 0.4,
    file: "/demo/bug-03/frames/bug03-dialog-open.png",
    format: "png",
    width: 800,
    height: 800,
    bytes: 67567,
    mimeType: "image/png",
    sourceVideo: "BUG-03 browser reproduction capture",
  },
  {
    frameId: "frame-00-01-1",
    timestamp: "00:01.1",
    timestampSeconds: 1.1,
    file: "/demo/bug-03/frames/bug03-cancel-blocked.png",
    format: "png",
    width: 800,
    height: 800,
    bytes: 64769,
    mimeType: "image/png",
    sourceVideo: "BUG-03 browser reproduction capture",
  },
];

export const bug03Investigation: EvidenceBundle = {
  sourceVideo: "BUG-03 buggy-variant browser capture",
  frames: bug03Frames,
  observations: [
    {
      kind: "observation",
      id: "obs-1",
      frameId: "frame-00-00-4",
      timestamp: "00:00.4",
      timestampSeconds: 0.4,
      statement: "At 00:00.4, 'Confirm Delivery Address' modal dialog is open with 'Cancel' and 'Confirm' buttons rendered.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-03/frames/bug03-dialog-open.png",
    },
    {
      kind: "observation",
      id: "obs-2",
      frameId: "frame-00-01-1",
      timestamp: "00:01.1",
      timestampSeconds: 1.1,
      statement: "At 00:01.1, after the Cancel interaction, the confirmation modal remains visible in the buggy variant.",
      confidence: "high",
      sourceFrameFile: "/demo/bug-03/frames/bug03-cancel-blocked.png",
    },
  ],
  expectedBehaviours: [
    {
      kind: "expected",
      id: "exp-1",
      statement: "Clicking Cancel must close the confirmation modal.",
      rawUserInput: "Clicking Cancel must close the confirmation modal.",
    },
  ],
  hypotheses: [
    {
      kind: "hypothesis",
      id: "hyp-1",
      statement: "Buggy variant places backdrop overlay with pointer-events: auto at z-index 50 above modal footer actions at z-index 40, blocking click events.",
      confidence: "high",
      inferredFrom: ["obs-2", "exp-1"],
    },
    {
      kind: "hypothesis",
      id: "hyp-2",
      statement: "Fixed variant gives modal action bar higher stacking context (z-index 60) so Cancel button directly receives pointer events.",
      confidence: "high",
      inferredFrom: ["obs-2", "exp-1"],
    },
  ],
  ambiguities: [
    {
      kind: "ambiguity",
      id: "amb-1",
      statement: "Computed z-index values and pointer-events CSS properties require DOM evaluation to confirm stacking order.",
      missingInfo: "Computed CSS property tree",
      affects: ["obs-2"],
    },
  ],
};
