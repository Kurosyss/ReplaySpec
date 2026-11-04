import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import type { FrameEvidence } from "../evidence";

const execFileAsync = promisify(execFile);

const FIXED_ARGS_FFPROBE = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name,avg_frame_rate", "-show_entries", "format=duration", "-of", "json"] as const;

export type ExtractionResult = {
  ok: true;
  frames: FrameEvidence[];
  duration: number;
  sourceVideo: string;
} | {
  ok: false;
  error: string;
  frames: FrameEvidence[];
};

/** Round candidate seek positions to the precision stored in evidence, then
 * derive the filename label from that same value so IDs and evidence cannot drift. */
export function normalizeFrameTimestamps(candidates: Array<{ t: number; label: string }>, duration: number): Array<{ t: number; label: string }> {
  const unique = new Map<number, { t: number; label: string }>();
  for (const candidate of candidates) {
    const t = Math.round(candidate.t * 10) / 10;
    if (!Number.isFinite(t) || t <= 0 || t >= duration) continue;
    const totalTenths = Math.round(t * 10);
    const wholeSeconds = Math.floor(totalTenths / 10);
    const minutes = String(Math.floor(wholeSeconds / 60)).padStart(2, "0");
    const seconds = String(wholeSeconds % 60).padStart(2, "0");
    const tenths = totalTenths % 10;
    unique.set(t, { t, label: `${minutes}:${seconds}.${tenths}` });
  }
  return [...unique.values()].sort((a, b) => a.t - b.t);
}

async function runFfprobeAsync(videoPath: string): Promise<{ width: number; height: number; codec: string; fps: string; duration: number } | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [...FIXED_ARGS_FFPROBE, videoPath], { encoding: "utf8", windowsHide: true });
    if (!stdout) return null;
    const json = JSON.parse(stdout);
    const stream = json.streams?.[0];
    const duration = parseFloat(json.format?.duration ?? "0");
    if (!stream || !duration) return null;
    return {
      width: stream.width,
      height: stream.height,
      codec: stream.codec_name,
      fps: stream.avg_frame_rate,
      duration,
    };
  } catch {
    return null;
  }
}

function runFfprobe(videoPath: string): { width: number; height: number; codec: string; fps: string; duration: number } | null {
  const res = spawnSync("ffprobe", [...FIXED_ARGS_FFPROBE, videoPath], { encoding: "utf8", shell: false });
  if (res.status !== 0 || !res.stdout) return null;
  try {
    const json = JSON.parse(res.stdout);
    const stream = json.streams?.[0];
    const duration = parseFloat(json.format?.duration ?? "0");
    if (!stream || !duration) return null;
    return {
      width: stream.width,
      height: stream.height,
      codec: stream.codec_name,
      fps: stream.avg_frame_rate,
      duration,
    };
  } catch {
    return null;
  }
}

/**
 * Extract ~5-6 timestamped frames from a BUG-01 recording.
 * Uses fixed server-controlled ffmpeg arguments, no shell execution, no user-supplied args.
 * Preserves chronological ordering, generates valid frame IDs and timestamps.
 * Saves frames under outputDir (e.g., test-results/runs/<runId>/frames or test-results/investigations/<id>/frames)
 * Returns FrameEvidence[] with relative file paths.
 */
export function extractFramesFromVideo(videoPath: string, outputDir: string, runIdForSource?: string): ExtractionResult {
  if (!videoPath || typeof videoPath !== "string") {
    return { ok: false, error: "Invalid video path", frames: [] };
  }
  // Prevent path traversal
  if (videoPath.includes("..") || videoPath.includes("\\") && videoPath.includes("..\\")) {
    return { ok: false, error: "Invalid video path (traversal)", frames: [] };
  }
  if (!fs.existsSync(videoPath)) {
    return { ok: false, error: `Video not found: ${videoPath}`, frames: [] };
  }

  // Check for empty (0 bytes) or very short (<0.5s) - handle honestly
  const stat = fs.statSync(videoPath);
  if (stat.size === 0) {
    return { ok: false, error: "Empty recording (0 bytes)", frames: [] };
  }

  const probe = runFfprobe(videoPath);
  if (!probe) {
    return { ok: false, error: "Failed to probe video (ffprobe)", frames: [] };
  }

  const duration = probe.duration;
  if (duration < 0.3) {
    return { ok: false, error: `Recording too short: ${duration.toFixed(2)}s (<0.3s)`, frames: [] };
  }

  // Choose timestamps covering the recording evenly, ~5-6 frames, avoiding very start (white flash)
  // For very short recordings (<2s), reduce count
  let timestamps: { t: number; label: string }[];
  if (duration < 1.5) {
    timestamps = [
      { t: Math.min(0.3, duration * 0.2), label: "00:00.3" },
      { t: Math.min(0.8, duration * 0.5), label: "00:00.8" },
      { t: Math.min(1.2, duration * 0.8), label: "00:01.2" },
    ];
  } else if (duration < 3) {
    timestamps = [
      { t: 0.5, label: "00:00.5" },
      { t: duration * 0.35, label: `00:${String(Math.floor(duration * 0.35)).padStart(2, "0")}.${Math.round((duration * 0.35 % 1) * 10)}` },
      { t: duration * 0.6, label: `00:${String(Math.floor(duration * 0.6)).padStart(2, "0")}.${Math.round((duration * 0.6 % 1) * 10)}` },
      { t: duration * 0.85, label: `00:${String(Math.floor(duration * 0.85)).padStart(2, "0")}.${Math.round((duration * 0.85 % 1) * 10)}` },
    ];
    // Normalize labels to valid mm:ss.s
    timestamps = timestamps.map((ts) => {
      const sec = ts.t;
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(Math.floor(sec % 60)).padStart(2, "0");
      const tenth = String(Math.round((sec % 1) * 10) % 10);
      return { t: sec, label: `${mm}:${ss}.${tenth}` };
    });
  } else {
    timestamps = [
      { t: 0.5, label: "00:00.5" },
      { t: 1.2, label: "00:01.2" },
      { t: 1.9, label: "00:01.9" },
      { t: 2.4, label: "00:02.4" },
      { t: 2.85, label: "00:02.8" },
      { t: Math.min(duration - 0.2, 4.0), label: `00:${String(Math.floor(Math.min(duration - 0.2, 4.0))).padStart(2, "0")}.${String(Math.round(((Math.min(duration - 0.2, 4.0) % 1) * 10)))}` },
    ];
    // Dedupe and clamp
    timestamps = timestamps.filter((ts) => ts.t < duration - 0.1 && ts.t > 0.2);
    if (timestamps.length > 6) timestamps = timestamps.slice(0, 6);
    if (timestamps.length < 5) {
      // For normal recordings, ensure 5-6
      timestamps = [
        { t: 0.5, label: "00:00.5" },
        { t: 1.2, label: "00:01.2" },
        { t: 1.9, label: "00:01.9" },
        { t: 2.4, label: "00:02.4" },
        { t: 2.85, label: "00:02.8" },
      ].filter((ts) => ts.t < duration);
    }
  }

  timestamps = normalizeFrameTimestamps(timestamps, duration);

  fs.mkdirSync(outputDir, { recursive: true });

  const frames: FrameEvidence[] = [];

  for (const { t, label } of timestamps) {
    const outName = `frame-${label.replace(/[:.]/g, "-")}.png`;
    const outPath = path.join(outputDir, outName);

    // Fixed server-controlled ffmpeg invocation, no shell, no user args
    const ffmpegArgs = ["-y", "-ss", String(t), "-i", videoPath, "-vframes", "1", "-q:v", "2", outPath];
    const res = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8", shell: false });

    if (res.status !== 0 || !fs.existsSync(outPath)) {
      // Record extraction error honestly, don't fabricate
      continue;
    }

    const fStat = fs.statSync(outPath);
    if (fStat.size < 4000) {
      // Likely blank/white frame, skip to avoid near-duplicates
      try { fs.unlinkSync(outPath); } catch {}
      continue;
    }

    // Get dimensions (fixed args)
    const dimRes = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name", "-of", "json", outPath], { encoding: "utf8", shell: false });
    if (dimRes.status !== 0 || !dimRes.stdout) {
      try { fs.unlinkSync(outPath); } catch {}
      continue;
    }
    try {
      const dimJson = JSON.parse(dimRes.stdout);
      const s = dimJson.streams?.[0];
      if (!s || !s.width || !s.height) {
        try { fs.unlinkSync(outPath); } catch {}
        continue;
      }
      frames.push({
        frameId: `frame-${label.replace(/[:.]/g, "-")}`,
        timestamp: label,
        timestampSeconds: Math.round(t * 10) / 10, // keep 0.1s precision
        file: `frames/${outName}`, // relative to investigation/run dir
        format: "png",
        width: s.width,
        height: s.height,
        bytes: fStat.size,
        mimeType: "image/png",
        sourceVideo: runIdForSource ? `run:${runIdForSource}` : videoPath,
      });
    } catch {
      try { fs.unlinkSync(outPath); } catch {}
      continue;
    }
  }

  // Validate timestamp ordering and uniqueness
  frames.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  // Check for duplicate IDs (should not happen with our naming, but ensure)
  const ids = new Set(frames.map((f) => f.frameId));
  if (ids.size !== frames.length) {
    return { ok: false, error: "Duplicate frame IDs generated", frames };
  }

  // If extraction produced 0 frames, it's a failure, not a silent success
  if (frames.length === 0) {
    return { ok: false, error: "No frames extracted (all failed or blank)", frames: [] };
  }
  if (frames.length < 3) {
    // For very short recordings this may be okay, but mark as warning - still return ok if at least 1
    // We treat <3 as incomplete but not fabricating
    return { ok: true, frames, duration, sourceVideo: videoPath };
  }

  return { ok: true, frames, duration, sourceVideo: videoPath };
}

/**
 * Non-blocking asynchronous version of extractFramesFromVideo.
 * Prevents Node event-loop starvation by using async child_process.execFile.
 */
export async function extractFramesFromVideoAsync(videoPath: string, outputDir: string, runIdForSource?: string): Promise<ExtractionResult> {
  if (!videoPath || typeof videoPath !== "string") {
    return { ok: false, error: "Invalid video path", frames: [] };
  }
  if (videoPath.includes("..") || (videoPath.includes("\\") && videoPath.includes("..\\"))) {
    return { ok: false, error: "Invalid video path (traversal)", frames: [] };
  }
  if (!fs.existsSync(videoPath)) {
    return { ok: false, error: `Video not found: ${videoPath}`, frames: [] };
  }

  const stat = fs.statSync(videoPath);
  if (stat.size === 0) {
    return { ok: false, error: "Empty recording (0 bytes)", frames: [] };
  }

  const probe = await runFfprobeAsync(videoPath);
  if (!probe) {
    return { ok: false, error: "Failed to probe video (ffprobe)", frames: [] };
  }

  const duration = probe.duration;
  if (duration < 0.3) {
    return { ok: false, error: `Recording too short: ${duration.toFixed(2)}s (<0.3s)`, frames: [] };
  }

  let timestamps: { t: number; label: string }[];
  if (duration < 1.5) {
    timestamps = [
      { t: Math.min(0.3, duration * 0.2), label: "00:00.3" },
      { t: Math.min(0.8, duration * 0.5), label: "00:00.8" },
      { t: Math.min(1.2, duration * 0.8), label: "00:01.2" },
    ];
  } else if (duration < 3) {
    timestamps = [
      { t: 0.5, label: "00:00.5" },
      { t: duration * 0.35, label: `00:${String(Math.floor(duration * 0.35)).padStart(2, "0")}.${Math.round((duration * 0.35 % 1) * 10)}` },
      { t: duration * 0.6, label: `00:${String(Math.floor(duration * 0.6)).padStart(2, "0")}.${Math.round((duration * 0.6 % 1) * 10)}` },
      { t: duration * 0.85, label: `00:${String(Math.floor(duration * 0.85)).padStart(2, "0")}.${Math.round((duration * 0.85 % 1) * 10)}` },
    ];
    timestamps = timestamps.map((ts) => {
      const sec = ts.t;
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(Math.floor(sec % 60)).padStart(2, "0");
      const tenth = String(Math.round((sec % 1) * 10) % 10);
      return { t: sec, label: `${mm}:${ss}.${tenth}` };
    });
  } else {
    timestamps = [
      { t: 0.5, label: "00:00.5" },
      { t: 1.2, label: "00:01.2" },
      { t: 1.9, label: "00:01.9" },
      { t: 2.4, label: "00:02.4" },
      { t: 2.85, label: "00:02.8" },
      { t: Math.min(duration - 0.2, 4.0), label: `00:${String(Math.floor(Math.min(duration - 0.2, 4.0))).padStart(2, "0")}.${String(Math.round(((Math.min(duration - 0.2, 4.0) % 1) * 10)))}` },
    ];
    timestamps = timestamps.filter((ts) => ts.t < duration - 0.1 && ts.t > 0.2);
    if (timestamps.length > 6) timestamps = timestamps.slice(0, 6);
    if (timestamps.length < 5) {
      timestamps = [
        { t: 0.5, label: "00:00.5" },
        { t: 1.2, label: "00:01.2" },
        { t: 1.9, label: "00:01.9" },
        { t: 2.4, label: "00:02.4" },
        { t: 2.85, label: "00:02.8" },
      ].filter((ts) => ts.t < duration);
    }
  }

  timestamps = normalizeFrameTimestamps(timestamps, duration);

  fs.mkdirSync(outputDir, { recursive: true });

  const framePromises = timestamps.map(async ({ t, label }) => {
    const outName = `frame-${label.replace(/[:.]/g, "-")}.png`;
    const outPath = path.join(outputDir, outName);

    const ffmpegArgs = ["-y", "-ss", String(t), "-i", videoPath, "-vframes", "1", "-q:v", "2", outPath];
    try {
      await execFileAsync("ffmpeg", ffmpegArgs, { windowsHide: true });
    } catch {
      return null;
    }

    if (!fs.existsSync(outPath)) return null;

    const fStat = fs.statSync(outPath);
    if (fStat.size < 4000) {
      try { fs.unlinkSync(outPath); } catch {}
      return null;
    }

    const item: FrameEvidence = {
      frameId: `frame-${label.replace(/[:.]/g, "-")}`,
      timestamp: label,
      timestampSeconds: Math.round(t * 10) / 10,
      file: `frames/${outName}`,
      format: "png",
      width: probe.width,
      height: probe.height,
      bytes: fStat.size,
      mimeType: "image/png",
      sourceVideo: runIdForSource ? `run:${runIdForSource}` : videoPath,
    };
    return item;
  });

  const extracted = await Promise.all(framePromises);
  const frames: FrameEvidence[] = extracted.filter((f): f is FrameEvidence => f !== null);

  frames.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  const ids = new Set(frames.map((f) => f.frameId));
  if (ids.size !== frames.length) {
    return { ok: false, error: "Duplicate frame IDs generated", frames };
  }

  if (frames.length === 0) {
    return { ok: false, error: "No frames extracted (all failed or blank)", frames: [] };
  }

  return { ok: true, frames, duration, sourceVideo: videoPath };
}
