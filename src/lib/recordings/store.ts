import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const RECORDINGS_ROOT = path.join(process.cwd(), "test-results", "recordings");

const ALLOWED_EXTENSIONS = [".mp4", ".webm"];
const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DURATION_SECONDS = 120;

export type RecordingMeta = {
  id: string;
  originalFileName: string;
  safeFileName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  durationSeconds: number | null;
  createdAt: string;
  title: string;
  expectedBehaviour: string;
  context?: string;
};

// Generate secure recording ID
export function generateRecordingId(): string {
  return `rec_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

export function isValidRecordingId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{4,64}$/.test(id) && !id.includes("..") && !id.includes("/") && !id.includes("\\");
}

function getRecordingDir(id: string): string | null {
  if (!isValidRecordingId(id)) return null;
  const dir = path.join(RECORDINGS_ROOT, id);
  const resolved = path.resolve(dir);
  const rootResolved = path.resolve(RECORDINGS_ROOT);
  if (!resolved.startsWith(rootResolved)) return null;
  return dir;
}

function ensureRoot() {
  fs.mkdirSync(RECORDINGS_ROOT, { recursive: true });
}

function atomicWriteFile(targetPath: string, data: string | Buffer) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${targetPath}.tmp-${crypto.randomBytes(4).toString("hex")}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, targetPath);
}

// Validate file extension
export function isAllowedExtension(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Validate MIME type
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

// Validate file signature (magic bytes) for MP4 and WebM
export function validateFileSignature(filePath: string, expectedExt: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const ext = expectedExt.toLowerCase();
    if (ext === ".mp4") {
      // MP4 should have ftyp at offset 4
      const ftyp = buffer.toString("ascii", 4, 8);
      return ftyp === "ftyp";
    } else if (ext === ".webm") {
      // WebM/Matroska starts with 1A 45 DF A3 (EBML)
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    }
    return false;
  } catch {
    return false;
  }
}

// Get video duration via ffprobe with fixed args, no shell
export function getVideoDuration(filePath: string): number | null {
  try {
    const res = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath], {
      encoding: "utf8",
      shell: false,
    });
    if (res.status !== 0 || !res.stdout) return null;
    const duration = parseFloat(res.stdout.trim());
    if (isNaN(duration) || duration <= 0) return null;
    return duration;
  } catch {
    return null;
  }
}

export function saveRecording(file: { originalName: string; mimeType: string; buffer: Buffer }, metadata: { title: string; expectedBehaviour: string; context?: string }): { ok: true; id: string; meta: RecordingMeta } | { ok: false; error: string } {
  // Validate extension
  if (!isAllowedExtension(file.originalName)) {
    return { ok: false, error: `Unsupported file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` };
  }

  // Validate MIME type
  if (!isAllowedMimeType(file.mimeType)) {
    return { ok: false, error: `Unsupported MIME type: ${file.mimeType}` };
  }

  // Validate file size
  if (file.buffer.length === 0) {
    return { ok: false, error: "Empty file" };
  }
  if (file.buffer.length > MAX_FILE_SIZE) {
    return { ok: false, error: `File too large: ${(file.buffer.length / 1024 / 1024).toFixed(1)}MB > 50MB` };
  }

  // Validate title and expected behaviour
  if (!metadata.title || metadata.title.trim().length === 0) {
    return { ok: false, error: "Investigation title is required" };
  }
  if (!metadata.expectedBehaviour || metadata.expectedBehaviour.trim().length === 0) {
    return { ok: false, error: "Expected behaviour is required" };
  }

  const id = generateRecordingId();
  const ext = path.extname(file.originalName).toLowerCase();
  const safeFileName = `recording${ext}`;
  const dir = getRecordingDir(id);
  if (!dir) return { ok: false, error: "Invalid recording ID" };

  try {
    ensureRoot();
    fs.mkdirSync(dir, { recursive: true });

    // Save original file with atomic write
    const filePath = path.join(dir, safeFileName);
    atomicWriteFile(filePath, file.buffer);

    // Validate file signature
    if (!validateFileSignature(filePath, ext)) {
      // Clean up and reject
      try { fs.unlinkSync(filePath); fs.rmdirSync(dir); } catch {}
      return { ok: false, error: "Invalid file signature — file content does not match extension (possibly corrupt or unsupported codec)" };
    }

    // Validate duration
    const duration = getVideoDuration(filePath);
    if (duration === null) {
      try { fs.unlinkSync(filePath); fs.rmdirSync(dir); } catch {}
      return { ok: false, error: "Unable to read video duration — file may be corrupt or unsupported codec" };
    }
    if (duration > MAX_DURATION_SECONDS) {
      try { fs.unlinkSync(filePath); fs.rmdirSync(dir); } catch {}
      return { ok: false, error: `Recording too long: ${duration.toFixed(1)}s > ${MAX_DURATION_SECONDS}s` };
    }

    // Handle case where ffprobe is missing
    if (duration === null && !fs.existsSync(filePath)) {
      return { ok: false, error: "Media inspection failed — ffprobe not available" };
    }

    const meta: RecordingMeta = {
      id,
      originalFileName: file.originalName,
      safeFileName,
      mimeType: file.mimeType,
      extension: ext,
      sizeBytes: file.buffer.length,
      durationSeconds: duration,
      createdAt: new Date().toISOString(),
      title: metadata.title.trim(),
      expectedBehaviour: metadata.expectedBehaviour.trim(),
      context: metadata.context?.trim(),
    };

    atomicWriteFile(path.join(dir, "metadata.json"), JSON.stringify(meta, null, 2));

    return { ok: true, id, meta };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Clean up on failure
    try {
      const dir = getRecordingDir(id);
      if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
    return { ok: false, error: `Failed to save recording: ${msg}` };
  }
}

export function getRecording(id: string): RecordingMeta | null {
  if (!isValidRecordingId(id)) return null;
  const dir = getRecordingDir(id);
  if (!dir) return null;
  const metaPath = path.join(dir, "metadata.json");
  if (!fs.existsSync(metaPath)) return null;
  try {
    const raw = fs.readFileSync(metaPath, "utf8");
    const meta = JSON.parse(raw);
    return meta as RecordingMeta;
  } catch {
    return null;
  }
}

export function getRecordingFilePath(id: string): string | null {
  const meta = getRecording(id);
  if (!meta) return null;
  const dir = getRecordingDir(id);
  if (!dir) return null;
  const filePath = path.join(dir, meta.safeFileName);
  if (!fs.existsSync(filePath)) return null;
  const resolved = path.resolve(filePath);
  const rootResolved = path.resolve(RECORDINGS_ROOT);
  if (!resolved.startsWith(rootResolved)) return null;
  return resolved;
}

export function listRecordings(): RecordingMeta[] {
  ensureRoot();
  try {
    const entries = fs.readdirSync(RECORDINGS_ROOT, { withFileTypes: true });
    const metas: RecordingMeta[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const meta = getRecording(entry.name);
      if (meta) metas.push(meta);
    }
    metas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return metas;
  } catch {
    return [];
  }
}

export function deleteRecording(id: string): { ok: true } | { ok: false; error: string } {
  if (!isValidRecordingId(id)) return { ok: false, error: "Invalid recording ID" };
  const dir = getRecordingDir(id);
  if (!dir) return { ok: false, error: "Invalid recording ID" };
  if (!fs.existsSync(dir)) return { ok: false, error: "Recording not found" };
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export const RECORDING_LIMITS = {
  MAX_FILE_SIZE,
  MAX_DURATION_SECONDS,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
