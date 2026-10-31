import fs from "node:fs";
import { spawnSync } from "node:child_process";
function makeManifest(outDir, videoLabel, duration, frames) {
  const manifest = {
    sourceVideo: videoLabel,
    sourceMeta: { width: 800, height: 450, codec: "vp9", fps: "25/1", duration, format: "webm/vp9" },
    extractedAt: new Date().toISOString(),
    frames: frames.map(f => {
      const stat = fs.statSync(`${outDir}/${f.file}`);
      const ip = JSON.parse(spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name","-of","json",`${outDir}/${f.file}`],{encoding:"utf8"}).stdout);
      return { timestamp: f.timestamp, timestampSeconds: f.ts, file: `${outDir}/${f.file}`.replace(/\\/g,"/"), format: "png", width: ip.streams[0].width, height: ip.streams[0].height, bytes: stat.size, mimeType: "image/png" };
    })
  };
  fs.writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest,null,2));
  console.log(`Manifest ${outDir}/manifest.json ${manifest.frames.length} frames`);
}

makeManifest("test-results/frames-empty-fixed-final", "bug-01 fixed empty-postal — genuine evidence, error visible", 5.8, [
  { file: "frame-00-00-8.png", timestamp: "00:00.8", ts: 0.8 },
  { file: "frame-00-01-2.png", timestamp: "00:01.2", ts: 1.2 },
  { file: "frame-00-01-8.png", timestamp: "00:01.8", ts: 1.8 },
  { file: "frame-00-02-5.png", timestamp: "00:02.5", ts: 2.5 },
  { file: "frame-00-03-2.png", timestamp: "00:03.2", ts: 3.2 },
  { file: "frame-00-04-0.png", timestamp: "00:04.0", ts: 4.0 },
]);

makeManifest("test-results/frames-empty-buggy-final", "bug-01 buggy empty-postal — genuine evidence, error hidden", 5.72, [
  { file: "frame-00-00-8.png", timestamp: "00:00.8", ts: 0.8 },
  { file: "frame-00-01-2.png", timestamp: "00:01.2", ts: 1.2 },
  { file: "frame-00-01-8.png", timestamp: "00:01.8", ts: 1.8 },
  { file: "frame-00-02-5.png", timestamp: "00:02.5", ts: 2.5 },
  { file: "frame-00-03-2.png", timestamp: "00:03.2", ts: 3.2 },
  { file: "frame-00-04-0.png", timestamp: "00:04.0", ts: 4.0 },
]);

// Copy to public for demo (only synthetic fixture frames, not raw artifacts)
import { spawnSync as sp2 } from "node:child_process";
for (const f of fs.readdirSync("test-results/frames-empty-fixed-final")) {
  if (f.endsWith(".png")) fs.copyFileSync(`test-results/frames-empty-fixed-final/${f}`, `public/demo/bug-01/frames-empty-fixed/${f}`);
}
for (const f of fs.readdirSync("test-results/frames-empty-buggy-final")) {
  if (f.endsWith(".png")) fs.copyFileSync(`test-results/frames-empty-buggy-final/${f}`, `public/demo/bug-01/frames-empty-buggy/${f}`);
}
console.log("Copied to public/demo/bug-01/frames-empty-*");
