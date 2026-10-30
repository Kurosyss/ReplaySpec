import fs from "node:fs";
const MODEL="meta-models/muse-spark-open-1026";
const ENDPOINT="https://inference.baseten.co/v1/chat/completions";
function loadEnv(){ const raw=fs.readFileSync(".env.local","utf8"); const env={}; for(const l of raw.split("\n")){ const t=l.trim(); if(!t||t.startsWith("#"))continue; const eq=t.indexOf("="); if(eq===-1)continue; let v=t.slice(eq+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); env[t.slice(0,eq).trim()]=v;} return env;}
const apiKey=loadEnv().BASETEN_API_KEY;
const b64=fs.readFileSync("test-results/probe-frame3.png").toString("base64");
const dataUri=`data:image/png;base64,${b64}`;
console.log(`png ${fs.statSync("test-results/probe-frame3.png").size} b64 ${b64.length}`);
const prompt=`Describe this screenshot. Is this a checkout form? What fields are visible? Is the postal-code error shown? What is the variant (buggy/fixed)?`;
const body={model:MODEL,messages:[{role:"user",content:[{type:"image_url",image_url:{url:dataUri,detail:"auto"}},{type:"text",text:prompt}]}],max_tokens:1000};
const start=Date.now();
const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify(body)});
const latency=Date.now()-start;
console.log(`HTTP ${res.status} ${latency}ms`);
const text=await res.text();
console.log(text.slice(0,8000));
fs.writeFileSync("test-results/probe-image-result2.json",JSON.stringify({status:res.status,latency,text:text.slice(0,15000)},null,2));
