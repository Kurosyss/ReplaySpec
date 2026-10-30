import fs from "node:fs";
const MODEL="meta-models/muse-spark-open-1026";
const ENDPOINT="https://inference.baseten.co/v1/chat/completions";
function loadEnv(){ const raw=fs.readFileSync(".env.local","utf8"); const env={}; for(const l of raw.split("\n")){ const t=l.trim(); if(!t||t.startsWith("#"))continue; const eq=t.indexOf("="); if(eq===-1)continue; let v=t.slice(eq+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); env[t.slice(0,eq).trim()]=v;} return env;}
const apiKey=loadEnv().BASETEN_API_KEY;
const vid="test-results/probe-fixed.mp4";
const b64=fs.readFileSync(vid).toString("base64");
const dataUri=`data:video/mp4;base64,${b64}`;
console.log(`mp4 ${fs.statSync(vid).size} b64 ${b64.length}`);
const prompt=`Analyze this browser recording. I can see video frames or I cannot view video — be explicit. List visible actions, timestamped events if supported, postal validation, error visibility, OBSERVED vs INFERENCE, uncertainties.`;
const body={model:MODEL,messages:[{role:"user",content:[{type:"video_url",video_url:{url:dataUri}},{type:"text",text:prompt}]}],max_tokens:2500,temperature:0.2};
const start=Date.now();
const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify(body)});
const latency=Date.now()-start;
console.log(`HTTP ${res.status} ${latency}ms`);
const text=await res.text();
console.log(text.slice(0,9000));
fs.writeFileSync("test-results/probe-video-result-3.json",JSON.stringify({status:res.status,latency,text:text.slice(0,15000)},null,2));
