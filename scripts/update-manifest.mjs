import fs from "node:fs";
import { spawnSync } from "node:child_process";

const OUT_DIR = "test-results/frames-bug01-fixed";
const VIDEO = "test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm";

const timestamps = [
  { t: 0.8, label: "00:00.8", file: "frame-00-00-8.png" },
  { t: 1.2, label: "00:01.2", file: "frame-00-01-2.png" },
  { t: 1.9, label: "00:01.9", file: "frame-00-01-9.png" },
  { t: 2.0, label: "00:02.0", file: "frame-00-02-0.png" },
  { t: 2.4, label: "00:02.4", file: "frame-00-02-4.png" },
  { t: 2.85, label: "00:02.8", file: "frame-00-02-8.png" },
];

const probe = JSON.parse(spawnSync("ffprobe", ["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name,avg_frame_rate","-show_entries","format=duration","-of","json", VIDEO], {encoding:"utf8"}).stdout);
const s = probe.streams[0];
const manifest = {
  sourceVideo: VIDEO,
  sourceMeta: { width: s.width, height: s.height, codec: s.codec_name, fps: s.avg_frame_rate, duration: parseFloat(probe.format.duration), format: "webm/vp9" },
  extractedAt: new Date().toISOString(),
  frames: []
};

for (const {t,label,file} of timestamps) {
  const full = `test-results/frames-bug01-fixed/${file}`;
  const stat = fs.statSync(full);
  const ip = JSON.parse(spawnSync("ffprobe", ["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name","-of","json", full], {encoding:"utf8"}).stdout);
  const st = ip.streams[0];
  manifest.frames.push({ timestamp: label, timestampSeconds: t, file: full.replace(/\\/g,"/"), format: "png", width: st.width, height: st.height, bytes: stat.size, mimeType: "image/png" });
}

fs.writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest,null,2));
