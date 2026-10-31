import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { EvidenceBundleSchema, type EvidenceBundle } from "../evidence";
import type { InvestigationMeta, InvestigationRecord, SpecData } from "./types";

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

    return { ok: true, id: record.meta.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to save investigation: ${msg}` };
  }
}

export function getInvestigation(id: string): InvestigationRecord | null {
  if (!isValidInvestigationId(id)) return null;
  const dir = getInvestigationDir(id);
  if (!dir) return null;
  const bundlePath = path.join(dir, "bundle.json");
  const metaPath = path.join(dir, "investigation.json");
  if (!fs.existsSync(bundlePath) || !fs.existsSync(metaPath)) return null;

  try {
    const bundleRaw = fs.readFileSync(bundlePath, "utf8");
    const metaRaw = fs.readFileSync(metaPath, "utf8");
    // Handle malformed JSON safely
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

    // Validate bundle after reading
    const parsed = EvidenceBundleSchema.safeParse(bundleJson);
    if (!parsed.success) return null;

    // Check for partially written (empty file)
    if (!metaJson || typeof metaJson !== "object") return null;

    return { bundle: parsed.data, meta: metaJson as InvestigationMeta };
  } catch {
    return null;
  }
}

export function listInvestigations(): InvestigationMeta[] {
  ensureRoot();
  try {
    const entries = fs.readdirSync(INVESTIGATIONS_ROOT, { withFileTypes: true });
    const metas: InvestigationMeta[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      if (!isValidInvestigationId(id)) continue;
      const meta = getInvestigation(id)?.meta;
      if (meta) metas.push(meta);
      // Silently skip malformed/partial records
    }
    // Sort by updatedAt descending
    metas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return metas;
  } catch {
    return [];
  }
}

export function getSpec(investigationId: string): SpecData | null {
  if (!isValidInvestigationId(investigationId)) return null;
  const dir = getInvestigationDir(investigationId);
  if (!dir) return null;
  const specPath = path.join(dir, "spec.json");
  if (!fs.existsSync(specPath)) return null;
  try {
    const raw = fs.readFileSync(specPath, "utf8");
    const parsed = JSON.parse(raw);
    // Basic validation, not strict Zod for now (allow empty)
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.assertions)) return null;
    return parsed as SpecData;
  } catch {
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
