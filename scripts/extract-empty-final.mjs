import fs from "node:fs";
import { spawnSync } from "node:child_process";
function probe(f){ return JSON.parse(spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name,avg_frame_rate","-show_entries","format=duration","-of","json",f],{encoding:"utf8"}).stdout); }
function extract(video,outDir, stamps){
  fs.mkdirSync(outDir,{recursive:true});
  // Clean old
  for(const f of fs.readdirSync(outDir)){ if(f.endsWith(".png")||f.endsWith(".json")) fs.unlinkSync(`${outDir}/${f}`); }
  const pr=probe(video); const s=pr.streams[0]; const d=parseFloat(pr.format.duration);
  console.log(`\n${video} ${d}s`);
  const frames=[];
  for(const {t,label} of stamps){
    const out=`${outDir}/frame-${label.replace(/[:.]/g,"-")}.png`;
    const r=spawnSync("ffmpeg",["-y","-ss",String(t),"-i",video,"-vframes","1","-q:v","2",out],{encoding:"utf8"});
    if(r.status!==0){ console.error(r.stderr.slice(0,200)); continue; }
    const stat=fs.statSync(out);
    if(stat.size<5000){ console.log(` skip ${label} blank ${stat.size}`); fs.unlinkSync(out); continue; }
    const ip=JSON.parse(spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name","-of","json",out],{encoding:"utf8"}).stdout);
    frames.push({timestamp:label,timestampSeconds:t,file:out.replace(/\\/g,"/"),format:"png",width:ip.streams[0].width,height:ip.streams[0].height,bytes:stat.size,mimeType:"image/png"});
    console.log(` ${label} -> ${out} ${stat.size}`);
  }
  const manifest={sourceVideo:video,sourceMeta:{width:s.width,height:s.height,codec:s.codec_name,fps:s.avg_frame_rate,duration:d,format:"webm/vp9"},extractedAt:new Date().toISOString(),frames};
  fs.writeFileSync(`${outDir}/manifest.json`,JSON.stringify(manifest,null,2));
  console.log(`Manifest ${outDir}/manifest.json ${frames.length} frames`);
}
const fixed="test-results/artifacts/e2e-bug-01.video-BUG-01-vi-9f930-alidation-error-with-video--chromium/video.webm";
const buggy="test-results/artifacts/e2e-bug-01.video-BUG-01-vi-e3110-al-error-hidden-with-video--chromium/video.webm";
extract(fixed,"test-results/frames-empty-fixed",[
  {t:1.5,label:"00:01.5"},
  {t:1.8,label:"00:01.8"},
  {t:2.0,label:"00:02.0"},
  {t:2.5,label:"00:02.5"},
  {t:3.2,label:"00:03.2"},
  {t:4.0,label:"00:04.0"},
]);
extract(buggy,"test-results/frames-empty-buggy",[
  {t:2.5,label:"00:02.5"},
  {t:2.9,label:"00:02.9"},
  {t:3.3,label:"00:03.3"},
  {t:4.0,label:"00:04.0"},
  {t:4.6,label:"00:04.6"},
  {t:5.2,label:"00:05.2"},
]);
