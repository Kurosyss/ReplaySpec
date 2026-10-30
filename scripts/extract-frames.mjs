import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VIDEO_FIXED =
  "test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm";
const OUT_DIR = "test-results/frames-bug01-fixed";

// 4-6 representative timestamps, distinct, avoid early white flash
const TIMESTAMPS = [
  { t: 0.5, label: "00:00.5" },
  { t: 1.2, label: "00:01.2" },
  { t: 1.9, label: "00:01.9" },
  { t: 2.4, label: "00:02.4" },
  { t: 2.85, label: "00:02.8" },
];

function runFfprobe(file) {
  const res = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,codec_name,avg_frame_rate",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      file,
    ],
    { encoding: "utf8" }
  );
  return JSON.parse(res.stdout);
}

function extractFrames() {
  if (!fs.existsSync(VIDEO_FIXED)) {
    console.error(`Video not found: ${VIDEO_FIXED}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const probe = runFfprobe(VIDEO_FIXED);
  const stream = probe.streams[0];
  const duration = parseFloat(probe.format.duration);
  console.log(`Source: ${VIDEO_FIXED}`);
  console.log(`Duration: ${duration}s, ${stream.width}x${stream.height}, ${stream.codec_name}, ${stream.avg_frame_rate}`);

  const manifest = {
    sourceVideo: VIDEO_FIXED,
    sourceMeta: {
      width: stream.width,
      height: stream.height,
      codec: stream.codec_name,
      fps: stream.avg_frame_rate,
      duration,
      format: "webm/vp9",
    },
    extractedAt: new Date().toISOString(),
    frames: [],
  };

  const hashes = new Set();

  for (const { t, label } of TIMESTAMPS) {
    const outName = `frame-${label.replace(/[:.]/g, "-")}.png`;
    const outPath = path.join(OUT_DIR, outName);

    // Extract single frame at timestamp t
    const ff = spawnSync(
      "ffmpeg",
      ["-y", "-ss", String(t), "-i", VIDEO_FIXED, "-vframes", "1", "-q:v", "2", outPath],
      { encoding: "utf8" }
    );
    if (ff.status !== 0) {
      console.error(ff.stderr.slice(0, 500));
      continue;
    }

    const stat = fs.statSync(outPath);
    // Simple deduplication: hash file size + first 1k bytes hash via file size check
    // For now use file size dedup, skip if duplicate size within 5% and previous exists
    const size = stat.size;
    // Also check if white frame (2131 bytes) skip
    if (size < 5000) {
      console.log(`Skip ${label} — likely blank/white frame ${size} bytes`);
      fs.unlinkSync(outPath);
      continue;
    }

    // Check for near-duplicate by comparing size proximity
    for (const h of hashes) {
      if (Math.abs(h - size) / size < 0.02) {
        // within 2% size, possible duplicate but keeping per requirement to avoid overly aggressive dedup
        console.log(`Note ${label} size ${size} close to previous ${h} — possible duplicate but keeping`);
      }
    }
    hashes.add(size);

    // Get image dimensions
    const ip = spawnSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name", "-of", "json", outPath],
      { encoding: "utf8" }
    );
    const ipJson = JSON.parse(ip.stdout);
    const imgStream = ipJson.streams[0];

    manifest.frames.push({
      timestamp: label,
      timestampSeconds: t,
      file: outPath.replace(/\\/g, "/"),
      format: "png",
      width: imgStream.width,
      height: imgStream.height,
      bytes: size,
      mimeType: "image/png",
    });
    console.log(`Extracted ${label} -> ${outName} ${imgStream.width}x${imgStream.height} ${size} bytes`);
  }

  // Also verify no near-identical via file hash simple
  console.log(`\nTotal frames: ${manifest.frames.length}`);

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Manifest: ${manifestPath}`);

  // Write also a quick visual index
  const indexHtml = `<!doctype html><title>BUG-01 frames</title><style>img{max-width:800px;border:1px solid #ddd;margin:8px} body{font-family:sans-serif}</style>${manifest.frames
    .map((f) => `<div><p>${f.timestamp} — ${f.width}x${f.height} ${f.bytes} bytes — ${f.file}</p><img src="${path.posix.relative(OUT_DIR, f.file)}"></div>`)
    .join("")}`;
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf8");
}

extractFrames();
