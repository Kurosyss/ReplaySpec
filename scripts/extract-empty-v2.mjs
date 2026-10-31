import fs from "node:fs";
import { spawnSync } from "node:child_process";
function probe(f){ return JSON.parse(spawnSync("ffprobe",["-v","error","-select_streams","v:0","-show_entries","stream=width,height,codec_name,avg_frame_rate","-show_entries","format=duration","-of","json",f],{encoding:"utf8"}).stdout); }
function extract(video,outDir, stamps){
  fs.mkdirSync(outDir,{recursive:true});
  const pr=probe(video); const s=pr.streams[0]; const d=parseFloat(pr.format.duration);
  console.log(`\n${video} ${d}s`);
  const frames=[];
  for(const {t,label} of stamps){
    const out=`${outDir}/frame-${label.replace(/[:.]/g,"-")}.png`;
    const r=spawnSync("ffmpeg",["-y","-ss",String(t),"-i",video,"-vframes","1","-q:v","2",out],{encoding:"utf8"});
    if(r.status!==0){console.error(r.stderr.slice(0,300));continue;}
    const stat=fs.statSync(out);
    if(stat.size<5000){console.log(` skip ${label} blank`);fs.unlinkSync(out);continue;}
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
extract(fixed,"test-results/frames-empty-fixed-v2",[{t:0.8,label:"00:00.8"},{t:1.3,label:"00:01.3"},{t:1.6,label:"00:01.6"},{t:1.9,label:"00:01.9"},{t:2.2,label:"00:02.2"},{t:2.6,label:"00:02.6"}]);
extract(buggy,"test-results/frames-empty-buggy-v2",[{t:0.8,label:"00:00.8"},{t:1.3,label:"00:01.3"},{t:1.6,label:"00:01.6"},{t:1.9,label:"00:01.9"},{t:2.2,label:"00:02.2"},{t:2.9,label:"00:02.9"}]);
