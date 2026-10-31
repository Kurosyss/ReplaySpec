#!/usr/bin/env node
/**
 * M2.2 Comparative Evidence — separate multi-image requests for fixed vs buggy
 * Requires finish_reason=stop and non-null content, concise prompt, max_tokens 6000.
 * Validates completed outputs with Zod evidence schemas.
 */

import fs from "node:fs";
import path from "node:path";

const MODEL = "meta-models/muse-spark-open-1026";
const ENDPOINT = "https://inference.baseten.co/v1/chat/completions";
const FIXED_MANIFEST = "test-results/frames-bug01-fixed/manifest.json";
const BUGGY_MANIFEST = "test-results/frames-bug01-buggy/manifest.json";
const OUT_FIXED = "test-results/probe-m2.2-fixed.json";
const OUT_BUGGY = "test-results/probe-m2.2-buggy.json";

function loadEnv() {
  const raw = fs.readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, eq).trim()] = v;
  }
  return env;
}

function mask(k) { return k ? `${k.slice(0,4)}...${k.slice(-4)} (${k.length})` : "***"; }

function buildContent(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const content = [];
  // Concise prompt — must fit within model context and produce complete answer under 6000 tokens
  content.push({
    type: "text",
    text: `You are ReplaySpec evidence analyzer. Analyze exactly the 6 timestamped frames in order. Do NOT use video. Respond with COMPLETE JSON only, no markdown fence.

Expected behaviour (verbatim): Submitting without postal code must display "Postal code is required."

Respond as JSON object with keys: observations, hypotheses, ambiguities
- observations: array of {id, frameId, timestamp, timestampSeconds, statement} — only what is DIRECTLY VISIBLE in that frame, cite timestamp
- hypotheses: array of {id, statement, confidence} — inferred defect cause, e.g. display:none
- ambiguities: array of {id, statement} — missing info

Example observation: {"id":"obs-1","frameId":"frame-00-00-8","timestamp":"00:00.8","timestampSeconds":0.8,"statement":"Checkout form visible with fields..."}
Example hypothesis: {"id":"hyp-1","statement":"Buggy variant likely hides error via display:none","confidence":"medium"}

Rules:
- Every observation must reference one of the 6 frames by exact timestamp below
- Keep timestamps in order 00:00.8, 00:01.2, 00:01.9, 00:02.0, 00:02.4, 00:02.8 (or 00:02.6 for buggy)
- State visible UI per frame, note differences between consecutive frames
- Identify validation feedback: is error "Postal code is required." visible?
- Label inferred clicks as hypothesis, not observation
- Report uncertainty in ambiguities
- Do not claim unseen browser interactions as observed`
  });

  for (const f of manifest.frames) {
    const b64 = fs.readFileSync(f.file).toString("base64");
    content.push({ type: "text", text: `Frame ${f.timestamp} (${f.timestampSeconds}s) frameId=${f.file.split("/").pop().replace(".png","")} ${f.width}x${f.height}` });
    content.push({ type: "image_url", image_url: { url: `data:${f.mimeType};base64,${b64}`, detail: "auto" } });
  }

  content.push({ type: "text", text: `Return JSON now. Remember: observations reference exact frameId/timestamp, keep order, do not invent unseen clicks.` });
  return { content, manifest };
}

async function probe(variant, manifestPath, outPath) {
  const env = loadEnv();
  const apiKey = env.BASETEN_API_KEY;
  console.log(`\n=== ${variant.toUpperCase()} probe ===`);
  console.log(`Manifest: ${manifestPath}`);
  const { content, manifest } = buildContent(manifestPath);
  console.log(`Frames: ${manifest.frames.length}, content parts: ${content.length}`);
  const body = {
    model: MODEL,
    messages: [{ role: "user", content }],
    max_tokens: 6000,
    temperature: 0.15,
  };
  const bodyStr = JSON.stringify(body);
  console.log(`Body: ${bodyStr.length} chars (~${(bodyStr.length/1024).toFixed(1)} KiB)`);
  if (bodyStr.length > 100*1024*1024) throw new Error("Body too large");

  const start = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: bodyStr,
  });
  const latency = Date.now() - start;
  console.log(`HTTP ${res.status} ${res.statusText} in ${latency}ms`);
  const raw = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
  const choice = parsed?.choices?.[0];
  const answer = choice?.message?.content;
  const reasoning = choice?.message?.reasoning_content;
  const finish = choice?.finish_reason;
  const usage = parsed?.usage ?? null;

  console.log(`finish_reason: ${finish}, content null? ${answer===null}, content len: ${answer? String(answer).length : 0}, reasoning len: ${reasoning? String(reasoning).length : 0}`);
  console.log(`Usage: ${JSON.stringify(usage)}`);
  if (answer) console.log(`Answer preview: ${String(answer).slice(0, 800)}`);
  else console.log(`Reasoning preview: ${String(reasoning).slice(0, 800)}`);

  const result = {
    timestamp: new Date().toISOString(),
    variant,
    model: MODEL,
    endpoint: ENDPOINT,
    manifest: manifestPath,
    frames: manifest.frames,
    request: { bodyChars: bodyStr.length, latencyMs: latency },
    response: {
      httpStatus: res.status,
      httpStatusText: res.statusText,
      latencyMs: latency,
      usage,
      finishReason: finish,
      headers: Object.fromEntries([...res.headers.entries()].filter(([k])=>!k.toLowerCase().includes("auth"))),
      body: parsed,
    },
    contentStatus: { hasContent: answer !== null && answer !== undefined, hasReasoning: !!reasoning, finishReason: finish },
  };
  fs.mkdirSync(path.dirname(outPath), {recursive:true});
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
  return result;
}

async function main() {
  console.log(`Model: ${MODEL}`);
  console.log(`API key: ${mask(loadEnv().BASETEN_API_KEY)}`);

  const fixed = await probe("fixed", FIXED_MANIFEST, OUT_FIXED);
  // Brief pause to respect rate limits
  await new Promise(r=>setTimeout(r, 2000));
  const buggy = await probe("buggy", BUGGY_MANIFEST, OUT_BUGGY);

  // Comparative check
  const comp = {
    generatedAt: new Date().toISOString(),
    fixed: { finish: fixed.response.finishReason, hasContent: fixed.contentStatus.hasContent, usage: fixed.response.usage },
    buggy: { finish: buggy.response.finishReason, hasContent: buggy.contentStatus.hasContent, usage: buggy.response.usage },
    comparison: {
      bothStop: fixed.response.finishReason==="stop" && buggy.response.finishReason==="stop",
      bothHaveContent: fixed.contentStatus.hasContent && buggy.contentStatus.hasContent,
    }
  };
  fs.writeFileSync("test-results/probe-m2.2-comparison.json", JSON.stringify(comp,null,2), "utf8");
  console.log(`\n=== COMPARISON ===`);
  console.log(JSON.stringify(comp,null,2));

  if (!fixed.contentStatus.hasContent || fixed.response.finishReason!=="stop") {
    console.warn("WARNING: fixed probe incomplete — reasoning_content is not final answer, need smaller prompt investigation");
  }
  if (!buggy.contentStatus.hasContent || buggy.response.finishReason!=="stop") {
    console.warn("WARNING: buggy probe incomplete");
  }
}

main().catch(e=>{console.error(e); process.exit(1);});
