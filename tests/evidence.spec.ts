import { test, expect } from "@playwright/test";
import {
  FrameEvidenceSchema,
  ObservationSchema,
  parseEvidenceBundle,
  safeParseEvidenceBundle,
  checkNoSilentPromotion,
  TimestampSchema,
} from "../src/lib/evidence";

/**
 * M2.1 — Evidence normalization tests.
 * Covers: timestamp ordering, frame references, invalid timestamps,
 * missing evidence, observation/hypothesis separation, malformed output.
 * All failures are HARNESS_ERROR, not DEFECT_CONFIRMED.
 */

const validFrames = [
  {
    frameId: "frame-00-00-8",
    timestamp: "00:00.8",
    timestampSeconds: 0.8,
    file: "test-results/frames-bug01-fixed/frame-00-00-8.png",
    format: "png" as const,
    width: 800,
    height: 450,
    bytes: 157369,
    mimeType: "image/png",
  },
  {
    frameId: "frame-00-01-2",
    timestamp: "00:01.2",
    timestampSeconds: 1.2,
    file: "test-results/frames-bug01-fixed/frame-00-01-2.png",
    format: "png" as const,
    width: 800,
    height: 450,
    bytes: 160543,
    mimeType: "image/png",
  },
  {
    frameId: "frame-00-01-9",
    timestamp: "00:01.9",
    timestampSeconds: 1.9,
    file: "test-results/frames-bug01-fixed/frame-00-01-9.png",
    format: "png" as const,
    width: 800,
    height: 450,
    bytes: 155653,
    mimeType: "image/png",
  },
];

const validExpected = {
  kind: "expected" as const,
  id: "exp-1",
  statement: 'Submitting without postal code must display "Postal code is required."',
  rawUserInput: 'Submitting without postal code must display "Postal code is required."',
};

test.describe("FrameEvidence — timestamp and dimensions", () => {
  test("accepts valid timestamp mm:ss.s", () => {
    expect(() => FrameEvidenceSchema.parse(validFrames[0])).not.toThrow();
    expect(() => TimestampSchema.parse("00:01.2")).not.toThrow();
    expect(() => TimestampSchema.parse("01:23.4")).not.toThrow();
  });

  test("rejects invalid timestamps", () => {
    expect(() => TimestampSchema.parse("0:01.2")).toThrow();
    expect(() => TimestampSchema.parse("00:1.2")).toThrow();
    expect(() => TimestampSchema.parse("00:01")).toThrow();
    expect(() => TimestampSchema.parse("not-a-time")).toThrow();
    expect(() => TimestampSchema.parse("00:01.20")).toThrow();
  });

  test("rejects non-positive dimensions", () => {
    expect(() =>
      FrameEvidenceSchema.parse({ ...validFrames[0], width: 0 })
    ).toThrow();
    expect(() =>
      FrameEvidenceSchema.parse({ ...validFrames[0], height: -1 })
    ).toThrow();
  });
});

test.describe("Observation — frame reference integrity", () => {
  test("valid observation references existing frame with matching timestamp", () => {
    const bundle = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:00.8",
          timestampSeconds: 0.8,
          statement: "Checkout form visible with fields Full name, Street address, City, Postal code",
          confidence: "high" as const,
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    expect(() => parseEvidenceBundle(bundle)).not.toThrow();
  });

  test("rejects observation referencing missing frameId", () => {
    const bundle = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-99-99-9",
          timestamp: "00:00.8",
          timestampSeconds: 0.8,
          statement: "Something visible",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("missing frameId"))).toBe(true);
    }
  });

  test("rejects observation with mismatched timestamp vs frame", () => {
    const bundle = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:01.2", // mismatch: frame is 00:00.8
          timestampSeconds: 0.8,
          statement: "Mismatched timestamp",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("does not match frame"))).toBe(true);
    }
  });

  test("rejects timestampSeconds mismatch", () => {
    const bundle = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:00.8",
          timestampSeconds: 99.9, // mismatch
          statement: "Wrong seconds",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(bundle);
    expect(result.success).toBe(false);
  });
});

test.describe("EvidenceBundle — timestamp ordering", () => {
  test("requires frames strictly increasing by timestampSeconds", () => {
    const outOfOrder = {
      frames: [validFrames[1], validFrames[0], validFrames[2]], // 1.2, 0.8, 1.9 — not sorted
      observations: [],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(outOfOrder);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("not strictly increasing"))).toBe(true);
    }
  });

  test("accepts correctly ordered frames", () => {
    const ordered = {
      frames: validFrames,
      observations: [],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    expect(() => parseEvidenceBundle(ordered)).not.toThrow();
  });

  test("rejects duplicate timestampSeconds (not strictly increasing)", () => {
    const dup = {
      frames: [
        validFrames[0],
        { ...validFrames[1], frameId: "frame-dup", timestamp: "00:00.8", timestampSeconds: 0.8 },
      ],
      observations: [],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(dup);
    expect(result.success).toBe(false);
  });
});

test.describe("Observation / Hypothesis separation", () => {
  test("preserves user expectation verbatim", () => {
    const raw = 'Submitting without postal code must display "Postal code is required."';
    const parsed = parseEvidenceBundle({
      frames: validFrames,
      observations: [],
      expectedBehaviours: [{ kind: "expected" as const, id: "exp-1", statement: raw, rawUserInput: raw }],
      hypotheses: [],
      ambiguities: [],
    });
    expect(parsed.expectedBehaviours[0].statement).toBe(raw);
    // Must not paraphrase or normalize
    expect(parsed.expectedBehaviours[0].statement).not.toBe("Show error when postal code missing");
  });

  test("rejects hypothesis colliding with observation id", () => {
    const bundle = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "shared-id",
          frameId: "frame-00-00-8",
          timestamp: "00:00.8",
          timestampSeconds: 0.8,
          statement: "Form visible",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [
        { kind: "hypothesis" as const, id: "shared-id", statement: "Possible display:none defect" },
      ],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("collides with observation"))).toBe(true);
    }
  });

  test("checkNoSilentPromotion detects hypothesis promoted to observation", () => {
    const bundle = parseEvidenceBundle({
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:00.8",
          timestampSeconds: 0.8,
          statement: "Defect is display:none hiding postal-error",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [
        { kind: "hypothesis" as const, id: "hyp-1", statement: "Defect is display:none hiding postal-error" },
      ],
      ambiguities: [],
    });
    const violations = checkNoSilentPromotion(bundle);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain("silent promotion");
  });

  test("allows distinct observation and hypothesis statements", () => {
    const bundle = parseEvidenceBundle({
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:00.8",
          timestampSeconds: 0.8,
          statement: "Checkout form visible, postal code field filled with 94105, no error visible",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [
        { kind: "hypothesis" as const, id: "hyp-1", statement: "HYPOTHESIS: buggy variant hides error via display:none", inferredFrom: ["obs-1"] },
      ],
      ambiguities: [],
    });
    expect(checkNoSilentPromotion(bundle).length).toBe(0);
  });

  test("rejects hypothesis inferredFrom unknown reference", () => {
    const bundle = {
      frames: validFrames,
      observations: [],
      expectedBehaviours: [validExpected],
      hypotheses: [
        { kind: "hypothesis" as const, id: "hyp-1", statement: "Some cause", inferredFrom: ["non-existent-id"] },
      ],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(bundle);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("inferredFrom references unknown"))).toBe(true);
    }
  });
});

test.describe("Malformed model output", () => {
  test("rejects completely malformed JSON", () => {
    const malformed = { nonsense: true, frames: "not an array" };
    const result = safeParseEvidenceBundle(malformed);
    expect(result.success).toBe(false);
  });

  test("rejects observation missing required frameId", () => {
    const raw = {
      frames: validFrames,
      observations: [{ kind: "observation", id: "obs-1", timestamp: "00:00.8", timestampSeconds: 0.8, statement: "Missing frameId" }],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(raw);
    expect(result.success).toBe(false);
  });

  test("rejects observation with invalid timestamp format from model", () => {
    const raw = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-00-00-8",
          timestamp: "00:0.8", // malformed
          timestampSeconds: 0.8,
          statement: "Bad timestamp from model",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(raw);
    expect(result.success).toBe(false);
  });

  test("model output with missing evidence reference fails validation", () => {
    const modelOutput = {
      frames: validFrames,
      observations: [
        {
          kind: "observation" as const,
          id: "obs-1",
          frameId: "frame-missing",
          timestamp: "00:05.0",
          timestampSeconds: 5.0,
          statement: "Model hallucinated frame",
        },
      ],
      expectedBehaviours: [validExpected],
      hypotheses: [],
      ambiguities: [],
    };
    const result = safeParseEvidenceBundle(modelOutput);
    expect(result.success).toBe(false);
  });
});

test.describe("ObservationSchema standalone — timestampSeconds bounds", () => {
  test("rejects timestampSeconds > 300", () => {
    expect(() =>
      ObservationSchema.parse({
        kind: "observation" as const,
        id: "obs-1",
        frameId: "f1",
        timestamp: "00:00.8",
        timestampSeconds: 301,
        statement: "out of bounds",
      })
    ).toThrow();
  });
});
