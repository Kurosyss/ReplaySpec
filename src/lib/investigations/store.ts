import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { EvidenceBundleSchema, type EvidenceBundle } from "../evidence";
import { bug01Investigation } from "../fixtures/bug01-investigation";
import { bug02Investigation } from "../fixtures/bug02-investigation";
import { bug03Investigation } from "../fixtures/bug03-investigation";
import type { InvestigationMeta, InvestigationRecord, SpecData } from "./types";

const BUG_01_META: InvestigationMeta = {
  id: "bug-01",
  title: "BUG-01 — Checkout postal-code validation (fixed)",
  bugId: "BUG-01",
  variant: "fixed",
  target: "/demo/bug-01?variant=fixed",
  status: "verified",
  verdict: "REGRESSION_VERIFIED",
  createdAt: "2026-03-30T10:00:00.000Z",
  updatedAt: "2026-03-30T10:00:00.000Z",
  runId: "run-bug-01-benchmark",
  frameCount: bug01Investigation.frames.length,
  duration: `${bug01Investigation.frames.length} frames`,
  sourceVideo: "fixture",
  specSupportStatus: "SUPPORTED",
};

export const CURATED_BENCHMARKS: InvestigationMeta[] = [
  BUG_01_META,
  {
    id: "bug-02",
    title: "BUG-02 — Cart counter race",
    bugId: "BUG-02",
    variant: "buggy",
    target: "/demo/bug-02?variant=buggy",
    status: "analyzed",
    verdict: "DEFECT_CONFIRMED",
    createdAt: "2026-04-01T14:30:00.000Z",
    updatedAt: "2026-04-01T14:30:00.000Z",
    runId: "run-bug-02-benchmark",
    frameCount: bug02Investigation.frames.length,
    duration: `${bug02Investigation.frames.length} frames`,
    sourceVideo: "fixture",
    specSupportStatus: "SUPPORTED",
  },
  {
    id: "bug-03",
    title: "BUG-03 — Modal Cancel blocked by overlay",
    bugId: "BUG-03",
    variant: "buggy",
    target: "/demo/bug-03?variant=buggy",
    status: "analyzed",
    verdict: "DEFECT_CONFIRMED",
    createdAt: "2026-04-02T09:15:00.000Z",
    updatedAt: "2026-04-02T09:15:00.000Z",
    runId: "run-bug-03-benchmark-buggy",
    frameCount: bug03Investigation.frames.length,
    duration: `${bug03Investigation.frames.length} frames`,
    sourceVideo: "fixture",
    specSupportStatus: "SUPPORTED",
  },
];

const INVESTIGATIONS_ROOT = path.join(process.cwd(), "test-results", "investigations");

// Ensure base directory exists
function ensureRoot() {
  fs.mkdirSync(INVESTIGATIONS_ROOT, { recursive: true });
}

// Sanitize ID: only allow alphanumeric, dash, underscore, 4-64 chars
const ID_RE = /^[a-zA-Z0-9_-]{4,64}$/;
export function isValidInvestigationId(id: string): boolean {
  if (typeof id !== "string") return false;
  if (!ID_RE.test(id)) return false;
  if (id.includes("..") || id.includes("/") || id.includes("\\")) return false;
  return true;
}

export function generateInvestigationId(): string {
  // collision-resistant: timestamp + 8 hex chars from crypto
  const ts = Date.now().toString(36);
  const rnd = crypto.randomBytes(4).toString("hex");
  return `${ts}-${rnd}`;
}

function getInvestigationDir(id: string): string | null {
  if (!isValidInvestigationId(id)) return null;
  const dir = path.join(INVESTIGATIONS_ROOT, id);
  const resolved = path.resolve(dir);
  const rootResolved = path.resolve(INVESTIGATIONS_ROOT);
  if (!resolved.startsWith(rootResolved)) return null;
  return dir;
}

// Atomic write: write to temp file then rename
function atomicWriteFile(targetPath: string, data: string) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${targetPath}.tmp-${crypto.randomBytes(4).toString("hex")}`;
  fs.writeFileSync(tmp, data, "utf8");
  fs.renameSync(tmp, targetPath);
}

function copyFileAtomic(src: string, dest: string) {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${dest}.tmp-${crypto.randomBytes(4).toString("hex")}`;
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}

export function saveInvestigation(record: InvestigationRecord): { ok: true; id: string } | { ok: false; error: string } {
  // Validate bundle before writing
  const parsed = EvidenceBundleSchema.safeParse(record.bundle);
  if (!parsed.success) {
    return { ok: false, error: `Invalid EvidenceBundle: ${parsed.error.issues.map(i => i.message).join("; ")}` };
  }
  if (!isValidInvestigationId(record.meta.id)) {
    return { ok: false, error: `Invalid investigation ID: ${record.meta.id}` };
  }

  const dir = getInvestigationDir(record.meta.id);
  if (!dir) return { ok: false, error: "Invalid investigation ID or path traversal" };

  try {
    // Validate frames have relative paths, not absolute arbitrary
    for (const frame of record.bundle.frames) {
      if (path.isAbsolute(frame.file) && !frame.file.startsWith("/demo/") && !frame.file.startsWith("test-results/") && !frame.file.startsWith("frames/")) {
        // We store relative filenames only - reject absolute arbitrary paths
        // But allow /demo/ prefix for fixture compatibility
        // For M3.3, we store frames/xxx.png relative
        if (frame.file.includes("..")) return { ok: false, error: `Invalid frame file path: ${frame.file}` };
      }
      if (frame.file.includes("..") || frame.file.includes("\\")) {
        return { ok: false, error: `Invalid frame file path: ${frame.file}` };
      }
    }

    ensureRoot();
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, "frames"), { recursive: true });

    // Copy frame files if they exist as source (for persistence, we copy to investigation's frames/)
    // We expect bundle frames to already be in correct relative form, but if source file exists at old path, copy it
    const updatedFrames = record.bundle.frames.map((frame) => {
      const originalPath = frame.file;
      // If file is a demo public path like /demo/bug-01/frames/... we keep as is (not copying)
      // If it's a test-results path that exists on disk, copy to investigation's frames directory
      let newFile = frame.file;
      if (originalPath.startsWith("test-results/") && fs.existsSync(originalPath)) {
        const fileName = path.basename(originalPath);
        const dest = path.join(dir, "frames", fileName);
        try {
          copyFileAtomic(originalPath, dest);
          newFile = `frames/${fileName}`;
        } catch {
          // If copy fails, keep original but mark error? For now, keep original
          newFile = originalPath;
        }
      } else if (originalPath.startsWith("/demo/") || originalPath.startsWith("frames/")) {
        // Already relative/demo path, keep as is if file exists in public, but for persistence we should ensure copy exists
        // If it's /demo/... we don't copy (public asset), keep reference
        newFile = originalPath;
      } else if (fs.existsSync(originalPath)) {
        // Generic existing file, copy
        const fileName = path.basename(originalPath);
        const dest = path.join(dir, "frames", fileName);
        try {
          copyFileAtomic(originalPath, dest);
          newFile = `frames/${fileName}`;
        } catch {}
      }
      return { ...frame, file: newFile };
    });

    const updatedBundle: EvidenceBundle = { ...record.bundle, frames: updatedFrames };
    // Re-validate after path adjustments
    const reParsed = EvidenceBundleSchema.safeParse(updatedBundle);
    if (!reParsed.success) {
      return { ok: false, error: `Post-copy validation failed: ${reParsed.error.issues.map(i => i.message).join("; ")}` };
    }

    // Atomic writes
    atomicWriteFile(path.join(dir, "bundle.json"), JSON.stringify(updatedBundle, null, 2));
    atomicWriteFile(path.join(dir, "investigation.json"), JSON.stringify(record.meta, null, 2));

    // Ensure spec files exist if not present (empty spec)
    const specPath = path.join(dir, "spec.json");
    if (!fs.existsSync(specPath)) {
      const emptySpec = { investigationId: record.meta.id, assertions: [], compiledSource: null, updatedAt: null };
      atomicWriteFile(specPath, JSON.stringify(emptySpec, null, 2));
    }
    const specTestPath = path.join(dir, "spec-test.ts");
    if (!fs.existsSync(specTestPath)) {
      atomicWriteFile(specTestPath, "// Generated spec will appear here after adding assertions\n");
    }

    _metaCache.set(record.meta.id, record.meta);
    invalidateInvestigationsCache();
    return { ok: true, id: record.meta.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to save investigation: ${msg}` };
  }
}

export function getInvestigation(id: string): InvestigationRecord | null {
  if (!isValidInvestigationId(id)) return null;

  // Check curated benchmark fixtures first
  const benchmark = CURATED_BENCHMARKS.find((b) => b.id === id);
  if (benchmark) {
    if (id === "bug-02") return { bundle: bug02Investigation, meta: benchmark };
    if (id === "bug-03") return { bundle: bug03Investigation, meta: benchmark };
    return { bundle: bug01Investigation, meta: benchmark };
  }

  const dir = getInvestigationDir(id);
  if (!dir) return null;
  const bundlePath = path.join(dir, "bundle.json");
  const metaPath = path.join(dir, "investigation.json");
  if (!fs.existsSync(bundlePath) || !fs.existsSync(metaPath)) {
    return null;
  }

  try {
    const bundleRaw = fs.readFileSync(bundlePath, "utf8");
    const metaRaw = fs.readFileSync(metaPath, "utf8");
    let bundleJson: unknown;
    let metaJson: unknown;
    try {
      bundleJson = JSON.parse(bundleRaw);
    } catch {
      return null;
    }
    try {
      metaJson = JSON.parse(metaRaw);
    } catch {
      return null;
    }

    const parsed = EvidenceBundleSchema.safeParse(bundleJson);
    if (!parsed.success) return null;

    if (!metaJson || typeof metaJson !== "object") return null;

    return { bundle: parsed.data, meta: metaJson as InvestigationMeta };
  } catch {
    return null;
  }
}

let _cachedMetas: InvestigationMeta[] | null = null;

export function invalidateInvestigationsCache() {
  _cachedMetas = null;
  try {
    const indexPath = path.join(INVESTIGATIONS_ROOT, ".index.json");
    if (fs.existsSync(indexPath)) {
      fs.unlinkSync(indexPath);
    }
  } catch {}
}

const _metaCache = new Map<string, InvestigationMeta>();

export function getInvestigationMeta(id: string): InvestigationMeta | null {
  if (!isValidInvestigationId(id)) return null;

  const benchmark = CURATED_BENCHMARKS.find((b) => b.id === id);
  if (benchmark) return benchmark;

  const cached = _metaCache.get(id);
  if (cached) return cached;

  const metaPath = path.join(INVESTIGATIONS_ROOT, id, "investigation.json");
  try {
    const metaRaw = fs.readFileSync(metaPath, "utf8");
    const metaJson = JSON.parse(metaRaw);
    if (!metaJson || typeof metaJson !== "object" || !metaJson.id) return null;
    const meta = metaJson as InvestigationMeta;
    _metaCache.set(id, meta);
    return meta;
  } catch {
    return null;
  }
}

export function listInvestigations(): InvestigationMeta[] {
  if (_cachedMetas !== null) return _cachedMetas;
  ensureRoot();
  try {
    const indexPath = path.join(INVESTIGATIONS_ROOT, ".index.json");
    try {
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Curated benchmark metadata is source-controlled and authoritative.
          // Older index snapshots can retain obsolete counts after fixture updates.
          const curatedIds = new Set(CURATED_BENCHMARKS.map((benchmark) => benchmark.id));
          const savedMetas = parsed.filter(
            (meta): meta is InvestigationMeta =>
              Boolean(meta) && typeof meta === "object" && typeof meta.id === "string" && !curatedIds.has(meta.id)
          );
          const refreshed = [...CURATED_BENCHMARKS, ...savedMetas];
          _cachedMetas = refreshed;
          try {
            fs.writeFileSync(indexPath, JSON.stringify(refreshed), "utf8");
          } catch {}
          return refreshed;
        }
      }
    } catch {}

    const entries = fs.readdirSync(INVESTIGATIONS_ROOT, { withFileTypes: true });
    const diskMetas: InvestigationMeta[] = [];
    const seenIds = new Set<string>();

    for (const b of CURATED_BENCHMARKS) {
      seenIds.add(b.id);
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      if (!isValidInvestigationId(id)) continue;
      if (seenIds.has(id)) continue;
      const meta = getInvestigationMeta(id);
      if (meta) {
        diskMetas.push(meta);
        seenIds.add(id);
      }
    }

    diskMetas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const metas = [...CURATED_BENCHMARKS, ...diskMetas];
    _cachedMetas = metas;

    try {
      fs.writeFileSync(indexPath, JSON.stringify(metas), "utf8");
    } catch {}

    return metas;
  } catch {
    return CURATED_BENCHMARKS;
  }
}

export function getSpec(investigationId: string): SpecData | null {
  if (!isValidInvestigationId(investigationId)) return null;
  const dir = getInvestigationDir(investigationId);
  if (!dir) return null;
  const specPath = path.join(dir, "spec.json");
  if (!fs.existsSync(specPath)) {
    if (investigationId === "bug-01") {
      return { investigationId: "bug-01", assertions: [], compiledSource: null, updatedAt: null };
    }
    return null;
  }
  try {
    const raw = fs.readFileSync(specPath, "utf8");
    const parsed = JSON.parse(raw);
    // Basic validation, not strict Zod for now (allow empty)
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.assertions)) return null;
    return parsed as SpecData;
  } catch {
    if (investigationId === "bug-01") {
      return { investigationId: "bug-01", assertions: [], compiledSource: null, updatedAt: null };
    }
    return null;
  }
}

export function saveSpec(investigationId: string, spec: SpecData): { ok: true } | { ok: false; error: string } {
  if (!isValidInvestigationId(investigationId)) return { ok: false, error: "Invalid investigation ID" };
  const dir = getInvestigationDir(investigationId);
  if (!dir || !fs.existsSync(dir)) return { ok: false, error: "Investigation not found" };
  try {
    // Validate spec has correct investigationId and no path traversal in assertion fields
    if (spec.investigationId !== investigationId) return { ok: false, error: "Spec investigationId mismatch" };
    for (const a of spec.assertions) {
      if (a.selector.includes("/") || a.selector.includes("\\") || a.selector.includes("..") || a.selector.includes("`") || a.selector.includes(";")) {
        // But allow only allowlisted selector, will be validated in assertion builder
        // For now, basic path check
        if (a.selector.includes("..")) return { ok: false, error: `Invalid selector: ${a.selector}` };
      }
      if (a.id.includes("/") || a.id.includes("\\") || a.id.includes("..")) return { ok: false, error: "Invalid assertion ID" };
    }
    atomicWriteFile(path.join(dir, "spec.json"), JSON.stringify(spec, null, 2));
    if (spec.compiledSource !== null) {
      atomicWriteFile(path.join(dir, "spec-test.ts"), spec.compiledSource);
    }
    // Update investigation meta updatedAt
    const metaPath = path.join(dir, "investigation.json");
    if (fs.existsSync(metaPath)) {
      const meta: InvestigationMeta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      meta.updatedAt = new Date().toISOString();
      atomicWriteFile(metaPath, JSON.stringify(meta, null, 2));
    }
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// Helper to get frame file path safely (prevent arbitrary access)
export function getFramePath(investigationId: string, fileName: string): string | null {
  if (!isValidInvestigationId(investigationId)) return null;
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) return null;
  const dir = getInvestigationDir(investigationId);
  if (!dir) return null;
  const full = path.join(dir, "frames", fileName);
  const resolved = path.resolve(full);
  const rootResolved = path.resolve(path.join(INVESTIGATIONS_ROOT, investigationId, "frames"));
  if (!resolved.startsWith(rootResolved)) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}
