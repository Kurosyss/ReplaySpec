import fs from "node:fs";
import { spawnSync } from "node:child_process";

function probe(file) {
  const r = spawnSync("ffprobe", ["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name,avg_frame_rate","-show_entries","format=duration","-of","json", file], {encoding:"utf8"});
  return JSON.parse(r.stdout);
}

function extractFrames(video, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const pr = probe(video);
  const s = pr.streams[0];
  const duration = parseFloat(pr.format.duration);
  console.log(`\nSource: ${video} -> ${duration}s ${s.width}x${s.height} ${s.codec_name}`);

  // Choose timestamps covering empty-field precondition, click, and result
  const stamps = duration > 3 ? [
    {t:0.6,label:"00:00.6"},
    {t:1.0,label:"00:01.0"},
    {t:1.6,label:"00:01.6"},
    {t:2.1,label:"00:02.1"},
    {t:2.6,label:"00:02.6"},
  ] : [
    {t:0.5,label:"00:00.5"},
    {t:0.9,label:"00:00.9"},
    {t:1.4,label:"00:01.4"},
    {t:1.9,label:"00:01.9"},
    {t:2.3,label:"00:02.3"},
  ];

  const frames=[];
  for (const {t,label} of stamps) {
    const outName = `frame-${label.replace(/[:.]/g,"-")}.png`;
    const outPath = `${outDir}/${outName}`;
    const r = spawnSync("ffmpeg", ["-y","-ss",String(t),"-i",video,"-vframes","1","-q:v","2",outPath], {encoding:"utf8"});
    if (r.status!==0) { console.error(r.stderr.slice(0,300)); continue; }
    const stat = fs.statSync(outPath);
    if (stat.size < 5000) { console.log(` Skip ${label} blank ${stat.size}`); fs.unlinkSync(outPath); continue; }
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

const fixedVideo = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-9f930-alidation-error-with-video--chromium/video.webm";
const buggyVideo = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-e3110-al-error-hidden-with-video--chromium/video.webm";

if (fs.existsSync(fixedVideo)) extractFrames(fixedVideo, "test-results/frames-bug01-empty-fixed");
if (fs.existsSync(buggyVideo)) extractFrames(buggyVideo, "test-results/frames-bug01-empty-buggy");
