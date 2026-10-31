import { z } from "zod";

/**
 * M2.1 Evidence normalization — timestamp-preserving, multi-frame.
 * Every Observation is traceable to a FrameEvidence via frameId + timestamp.
 * ExpectedBehaviour is preserved verbatim; Hypotheses are never promoted.
 */

// Matches manifest format: "00:01.2", "00:02.8", "01:23.4" etc (mm:ss.s)
export const TimestampSchema = z
  .string()
  .regex(/^\d{2}:\d{2}\.\d$/, "timestamp must be mm:ss.s (e.g. 00:01.2)")
  .describe("frame timestamp mm:ss.s");

export const FrameEvidenceSchema = z.object({
  frameId: z.string().min(1),
  timestamp: TimestampSchema,
  timestampSeconds: z.number().min(0).max(300),
  file: z.string().min(1),
  format: z.enum(["png", "jpeg", "jpg", "webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
  mimeType: z.string().min(1),
  sourceVideo: z.string().optional(),
});

export type FrameEvidence = z.infer<typeof FrameEvidenceSchema>;

export const ObservationProvenanceSchema = z.enum(["VISUAL_FRAME", "PLAYWRIGHT_DOM_ASSERTION", "MODEL_FRAME_ANALYSIS"]);
export type ObservationProvenance = z.infer<typeof ObservationProvenanceSchema>;

export const ObservationSchema = z.object({
  kind: z.literal("observation"),
  id: z.string().min(1),
  frameId: z.string().min(1),
  timestamp: TimestampSchema,
  timestampSeconds: z.number().min(0).max(300),
  statement: z.string().min(1).describe("directly visible in frame"),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  sourceFrameFile: z.string().optional(),
  provenance: ObservationProvenanceSchema.optional().describe("Evidence source: visual, DOM assertion, or model analysis"),
});

export type Observation = z.infer<typeof ObservationSchema>;

export const ExpectedBehaviourSchema = z.object({
  kind: z.literal("expected"),
  id: z.string().min(1),
  statement: z.string().min(1).describe("verbatim user expectation, do not paraphrase"),
  rawUserInput: z.string().min(1).optional(),
});

export type ExpectedBehaviour = z.infer<typeof ExpectedBehaviourSchema>;

export const HypothesisSchema = z.object({
  kind: z.literal("hypothesis"),
  id: z.string().min(1),
  statement: z.string().min(1).describe("inferred cause, selector or defect hypothesis"),
  inferredFrom: z.array(z.string()).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export type Hypothesis = z.infer<typeof HypothesisSchema>;

export const AmbiguitySchema = z.object({
  kind: z.literal("ambiguity"),
  id: z.string().min(1),
  statement: z.string().min(1).describe("missing or uncertain information"),
  missingInfo: z.string().optional(),
  affects: z.array(z.string()).optional(),
});

export type Ambiguity = z.infer<typeof AmbiguitySchema>;

/**
 * Bundle validates cross-references. Observations must point to existing frames,
 * timestamps must be consistent and ordered.
 */
export const EvidenceBundleSchema = z
  .object({
    sourceVideo: z.string().optional(),
    frames: z.array(FrameEvidenceSchema).min(1),
    observations: z.array(ObservationSchema),
    expectedBehaviours: z.array(ExpectedBehaviourSchema),
    hypotheses: z.array(HypothesisSchema),
    ambiguities: z.array(AmbiguitySchema),
  })
  .superRefine((bundle, ctx) => {
    const frameMap = new Map(bundle.frames.map((f) => [f.frameId, f]));

    // 1. Timestamp ordering: frames must be strictly increasing by timestampSeconds
    for (let i = 1; i < bundle.frames.length; i++) {
      const prev = bundle.frames[i - 1].timestampSeconds;
      const curr = bundle.frames[i].timestampSeconds;
      if (curr <= prev) {
        ctx.addIssue({
          code: "custom",
          message: `frames not strictly increasing: ${bundle.frames[i - 1].frameId} (${prev}s) -> ${bundle.frames[i].frameId} (${curr}s)`,
          path: ["frames", i, "timestampSeconds"],
        });
      }
    }

    // 2. Every observation must reference an existing frame and matching timestamp
    for (let i = 0; i < bundle.observations.length; i++) {
      const obs = bundle.observations[i];
      const frame = frameMap.get(obs.frameId);
      if (!frame) {
        ctx.addIssue({
          code: "custom",
          message: `observation ${obs.id} references missing frameId ${obs.frameId}`,
          path: ["observations", i, "frameId"],
        });
        continue;
      }
      if (frame.timestamp !== obs.timestamp) {
        ctx.addIssue({
          code: "custom",
          message: `observation ${obs.id} timestamp ${obs.timestamp} does not match frame ${frame.frameId} timestamp ${frame.timestamp}`,
          path: ["observations", i, "timestamp"],
        });
      }
      if (Math.abs(frame.timestampSeconds - obs.timestampSeconds) > 0.001) {
        ctx.addIssue({
          code: "custom",
          message: `observation ${obs.id} timestampSeconds ${obs.timestampSeconds} mismatches frame ${frame.timestampSeconds}`,
          path: ["observations", i, "timestampSeconds"],
        });
      }
    }

    // 3. Observation/hypothesis separation: no hypothesis id should appear as observation id
    const obsIds = new Set(bundle.observations.map((o) => o.id));
    for (let i = 0; i < bundle.hypotheses.length; i++) {
      if (obsIds.has(bundle.hypotheses[i].id)) {
        ctx.addIssue({
          code: "custom",
          message: `hypothesis ${bundle.hypotheses[i].id} collides with observation id — separation violated`,
          path: ["hypotheses", i, "id"],
        });
      }
    }

    // 4. Hypotheses inferredFrom should reference existing observations where possible (warn, not fail, but we enforce existence if provided)
    for (let i = 0; i < bundle.hypotheses.length; i++) {
      const h = bundle.hypotheses[i];
      if (h.inferredFrom) {
        for (const ref of h.inferredFrom) {
          if (!obsIds.has(ref) && !frameMap.has(ref)) {
            ctx.addIssue({
              code: "custom",
              message: `hypothesis ${h.id} inferredFrom references unknown ${ref}`,
              path: ["hypotheses", i, "inferredFrom"],
            });
          }
        }
      }
    }
  });

export type EvidenceBundle = z.infer<typeof EvidenceBundleSchema>;

/**
 * Parse and validate raw model JSON (malformed detection).
 * Returns parsed bundle or throws ZodError.
 */
export function parseEvidenceBundle(raw: unknown): EvidenceBundle {
  return EvidenceBundleSchema.parse(raw);
}

/**
 * Safe parse returning result object for test harness.
 */
export function safeParseEvidenceBundle(raw: unknown) {
  return EvidenceBundleSchema.safeParse(raw);
}

/**
 * Helper to assert no silent promotion: caller must explicitly map hypothesis to observation
 * via separate step. This function checks that no observation statement equals a hypothesis statement verbatim
 * without explicit mapping — indicates promotion.
 */
export function checkNoSilentPromotion(bundle: EvidenceBundle): string[] {
  const violations: string[] = [];
  const obsStatements = new Set(bundle.observations.map((o) => o.statement.trim()));
  for (const h of bundle.hypotheses) {
    if (obsStatements.has(h.statement.trim())) {
      violations.push(`hypothesis ${h.id} statement duplicated as observation — possible silent promotion`);
    }
  }
  return violations;
}
