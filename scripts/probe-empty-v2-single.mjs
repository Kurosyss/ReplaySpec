import fs from "node:fs";
const MODEL="meta-models/muse-spark-open-1026";
const ENDPOINT="https://inference.baseten.co/v1/chat/completions";
function loadEnv(){ const raw=fs.readFileSync(".env.local","utf8"); const env={}; for(const l of raw.split("\n")){ const t=l.trim(); if(!t||t.startsWith("#"))continue; const eq=t.indexOf("="); if(eq===-1)continue; let v=t.slice(eq+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); env[t.slice(0,eq).trim()]=v;} return env; }
const apiKey=loadEnv().BASETEN_API_KEY;
const files=["test-results/frames-empty-fixed-v2/frame-00-01-6.png","test-results/frames-empty-buggy-v2/frame-00-01-6.png"];
for(const file of files){
  const b64=fs.readFileSync(file).toString("base64");
  const body={model:MODEL,messages:[{role:"user",content:[{type:"image_url",image_url:{url:`data:image/png;base64,${b64}`,detail:"auto"}},{type:"text",text:"Is postal code input empty (showing placeholder) or filled with 94105? Is red error 'Postal code is required.' visible? Describe."}]}],max_tokens:800,temperature:0.1};
  const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:JSON.stringify(body)});
  const j=await res.json();
  console.log(`\n=== ${file} ===`);
  console.log((j.choices[0].message.content ?? j.choices[0].message.reasoning_content).slice(0,600));
}
