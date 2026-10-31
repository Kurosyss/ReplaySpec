import fs from "node:fs";
import { spawnSync } from "node:child_process";

const VIDEO_BUGGY = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-2406b-t-demonstration-with-video--chromium/video.webm";
const VIDEO_FIXED = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-de647-submission-flow-with-video--chromium/video.webm";
const OUT_BUGGY = "test-results/frames-bug01-buggy";
const OUT_FIXED = "test-results/frames-bug01-fixed";

function probe(file) {
  const r = spawnSync("ffprobe", ["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name,avg_frame_rate","-show_entries","format=duration","-of","json", file], {encoding:"utf8"});
  return JSON.parse(r.stdout);
}

function extract(video, outDir, stamps) {
  fs.mkdirSync(outDir, {recursive:true});
  const pr = probe(video);
  const s = pr.streams[0];
  const duration = parseFloat(pr.format.duration);
  console.log(`${video} -> ${duration}s ${s.width}x${s.height} ${s.codec_name}`);
  const frames = [];
  for (const {t,label} of stamps) {
    const outName = `frame-${label.replace(/[:.]/g,"-")}.png`;
    const outPath = `${outDir}/${outName}`;
    const r = spawnSync("ffmpeg", ["-y","-ss",String(t),"-i",video,"-vframes","1","-q:v","2",outPath], {encoding:"utf8"});
    if (r.status!==0) { console.error(r.stderr.slice(0,500)); continue; }
    const stat = fs.statSync(outPath);
    if (stat.size < 5000) { console.log(`Skip ${label} blank ${stat.size}`); fs.unlinkSync(outPath); continue; }
    const ip = JSON.parse(spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name","-of","json",outPath],{encoding:"utf8"}).stdout);
    const st = ip.streams[0];
    frames.push({timestamp:label,timestampSeconds:t,file:outPath.replace(/\\/g,"/"),format:"png",width:st.width,height:st.height,bytes:stat.size,mimeType:"image/png"});
    console.log(`  ${label} -> ${outName} ${st.width}x${st.height} ${stat.size}`);
  }
  const manifest = {
    sourceVideo: video,
    sourceMeta: {width:s.width,height:s.height,codec:s.codec_name,fps:s.avg_frame_rate,duration,format:"webm/vp9"},
    extractedAt: new Date().toISOString(),
    frames
  };
  fs.writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest,null,2));
  console.log(`Manifest ${outDir}/manifest.json ${frames.length} frames`);
  return manifest;
}

const stamps = [
  {t:0.8,label:"00:00.8"},
  {t:1.2,label:"00:01.2"},
  {t:1.9,label:"00:01.9"},
  {t:2.0,label:"00:02.0"},
  {t:2.4,label:"00:02.4"},
  {t:2.8,label:"00:02.8"},
];

// Try fixed first - if already has 6, skip, else re-extract
if (fs.existsSync(VIDEO_FIXED)) {
  // Only re-extract if manifest missing or source mismatch
  if (!fs.existsSync(`${OUT_FIXED}/manifest.json`)) {
    extract(VIDEO_FIXED, OUT_FIXED, stamps);
  } else {
    console.log(`Fixed manifest exists, skipping re-extract`);
    // verify timestamps still align
    const m = JSON.parse(fs.readFileSync(`${OUT_FIXED}/manifest.json`, "utf8"));
    console.log(`Fixed existing: ${m.frames.length} frames from ${m.sourceVideo}`);
  }
}
if (fs.existsSync(VIDEO_BUGGY)) {
  extract(VIDEO_BUGGY, OUT_BUGGY, stamps);
}
