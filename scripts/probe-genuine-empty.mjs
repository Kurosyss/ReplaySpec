#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const MODEL="meta-models/muse-spark-open-1026";
const ENDPOINT="https://inference.baseten.co/v1/chat/completions";
function loadEnv(){ const raw=fs.readFileSync(".env.local","utf8"); const env={}; for(const l of raw.split("\n")){ const t=l.trim(); if(!t||t.startsWith("#"))continue; const eq=t.indexOf("="); if(eq===-1)continue; let v=t.slice(eq+1).trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); env[t.slice(0,eq).trim()]=v;} return env; }
function mask(k){return k?`${k.slice(0,4)}...${k.slice(-4)} (${k.length})`:"***";}
function buildContent(manifestPath){
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
  const content=[];
  content.push({type:"text",text:`You are ReplaySpec evidence analyzer. Analyze exactly the ${manifest.frames.length} timestamped frames in chronological order. Respond with COMPLETE JSON only, no markdown fence.

Expected behaviour (verbatim): Submitting without postal code must display "Postal code is required."

Respond as JSON with keys: observations, hypotheses, ambiguities
- observations: array of {id, frameId, timestamp, timestampSeconds, statement} — only what is DIRECTLY VISIBLE in that frame, cite exact timestamp, state empty-field precondition explicitly
- hypotheses: array of {id, statement, confidence}
- ambiguities: array of {id, statement}

Example observation: {"id":"obs-1","frameId":"frame-00-00-8","timestamp":"00:00.8","timestampSeconds":0.8,"statement":"Postal code input is empty with placeholder Enter postal code at 00:00.8 ..."}
Rules: Every observation must reference one of the ${manifest.frames.length} frames by exact timestamp below. Keep timestamps in order ${manifest.frames.map(f=>f.timestamp).join(", ")}. State empty postal precondition explicitly (field empty vs filled). Identify validation feedback: is red error "Postal code is required." visible? Label inferred clicks as hypothesis. Report uncertainty in ambiguities.`});
  for(const f of manifest.frames){
    const b64=fs.readFileSync(f.file).toString("base64");
    content.push({type:"text",text:`Frame ${f.timestamp} (${f.timestampSeconds}s) frameId=${f.file.split("/").pop().replace(".png","")} ${f.width}x${f.height}`});
    content.push({type:"image_url",image_url:{url:`data:${f.mimeType};base64,${b64}`,detail:"auto"}});
  }
  content.push({type:"text",text:"Return JSON now. Remember: observations reference exact frameId/timestamp, keep order, state empty-field precondition, separate OBSERVED vs HYPOTHESIS."});
  return {content,manifest};
}
async function probe(variant, manifestPath, outPath){
  const env=loadEnv(); const apiKey=env.BASETEN_API_KEY;
  console.log(`\n=== ${variant.toUpperCase()} genuine empty-postal ===`);
  const {content,manifest}=buildContent(manifestPath);
  console.log(`Frames: ${manifest.frames.length}, content parts: ${content.length}`);
  const body={model:MODEL,messages:[{role:"user",content}],max_tokens:6000,temperature:0.14};
  const bodyStr=JSON.stringify(body);
  console.log(`Body: ${bodyStr.length} chars (~${(bodyStr.length/1024).toFixed(1)} KiB)`);
  const start=Date.now();
  const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},body:bodyStr});
  const latency=Date.now()-start;
  console.log(`HTTP ${res.status} ${res.statusText} in ${latency}ms`);
  const raw=await res.text();
  let parsed=null; try{parsed=JSON.parse(raw);}catch{parsed={raw};}
  const choice=parsed?.choices?.[0];
  const answer=choice?.message?.content;
  const finish=choice?.finish_reason;
  const usage=parsed?.usage??null;
  console.log(`finish_reason: ${finish}, hasContent: ${!!answer}, content len: ${answer? String(answer).length:0}`);
  if(answer) console.log(`Preview: ${String(answer).slice(0,700)}`);
  console.log(`Usage: ${JSON.stringify(usage)}`);
  const result={timestamp:new Date().toISOString(),variant,model:MODEL,endpoint:ENDPOINT,manifest:manifestPath,frames:manifest.frames,request:{bodyChars:bodyStr.length,latencyMs:latency},response:{httpStatus:res.status,httpStatusText:res.statusText,latencyMs:latency,usage,finishReason:finish,headers:Object.fromEntries([...res.headers.entries()].filter(([k])=>!k.toLowerCase().includes("auth"))),body:parsed},contentStatus:{hasContent:answer!==null&&answer!==undefined,finishReason:finish}};
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  fs.writeFileSync(outPath,JSON.stringify(result,null,2),"utf8");
  console.log(`Wrote ${outPath}`);
  return result;
}
async function main(){
  console.log(`Model: ${MODEL} API key: ${mask(loadEnv().BASETEN_API_KEY)}`);
  const fixed=await probe("fixed-empty-genuine","test-results/frames-empty-fixed-final/manifest.json","test-results/probe-genuine-fixed.json");
  await new Promise(r=>setTimeout(r,1500));
  const buggy=await probe("buggy-empty-genuine","test-results/frames-empty-buggy-final/manifest.json","test-results/probe-genuine-buggy.json");
  const comp={generatedAt:new Date().toISOString(),fixed:{finish:fixed.response.finishReason,hasContent:fixed.contentStatus.hasContent,usage:fixed.response.usage},buggy:{finish:buggy.response.finishReason,hasContent:buggy.contentStatus.hasContent,usage:buggy.response.usage},bothStop:fixed.response.finishReason==="stop"&&buggy.response.finishReason==="stop",bothHaveContent:fixed.contentStatus.hasContent&&buggy.contentStatus.hasContent};
  fs.writeFileSync("test-results/probe-genuine-comparison.json",JSON.stringify(comp,null,2),"utf8");
  console.log(`\n=== COMPARISON ===\n${JSON.stringify(comp,null,2)}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
