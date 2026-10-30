#!/usr/bin/env node
/**
 * M2.1 Multi-frame temporal evidence probe.
 * Sends 6 timestamped image_url parts in a single user message to
 * meta-models/muse-spark-open-1026 via Baseten.
 * Validates multi-image understanding, frame order, state changes, validation feedback.
 */

import fs from "node:fs";
import path from "node:path";

const MANIFEST = "test-results/frames-bug01-fixed/manifest.json";
const MODEL = "meta-models/muse-spark-open-1026";
const ENDPOINT = "https://inference.baseten.co/v1/chat/completions";
const OUT = "test-results/probe-multiframe-result.json";

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

function maskKey(k) { return k ? `${k.slice(0,4)}...${k.slice(-4)} (${k.length} chars)` : "***"; }

async function main() {
  console.log("M2.1 Multi-frame probe — timestamp-preserving multi-image analysis");
  console.log(`Model: ${MODEL}`);
  console.log(`Endpoint: ${ENDPOINT}`);

  const env = loadEnv();
  const apiKey = env.BASETEN_API_KEY || process.env.BASETEN_API_KEY;
  if (!apiKey) { console.error("Missing BASETEN_API_KEY in .env.local"); process.exit(1); }
  console.log(`API key: ${maskKey(apiKey)}`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  console.log(`Manifest: ${manifest.frames.length} frames from ${manifest.sourceVideo}`);
  for (const f of manifest.frames) {
    console.log(`  ${f.timestamp} (${f.timestampSeconds}s) ${f.width}x${f.height} ${f.bytes} bytes ${f.file}`);
  }

  // Build content array: for each frame, add timestamp text then image
  const content = [];
  content.push({
    type: "text",
    text: `You are analyzing a timestamped sequence of 6 screenshots extracted from a browser recording of BUG-01 Checkout postal-code validation at /demo/bug-01?variant=fixed. Each screenshot is presented in chronological order with its timestamp. Preserve frame order. Do not invent actions you cannot see.

Expected behaviour (verbatim, preserve exactly): "Submitting without postal code must display \\"Postal code is required.\\""

Invariant for regression test: After clicking Place order with empty postal code, element [data-testid="postal-error"] must be visible and contain "Postal code is required."`
  });

  for (const frame of manifest.frames) {
    const b64 = fs.readFileSync(frame.file).toString("base64");
    const dataUri = `data:${frame.mimeType};base64,${b64}`;
    content.push({
      type: "text",
      text: `Frame ${frame.timestamp} (${frame.timestampSeconds}s) — ${frame.width}x${frame.height} ${frame.format.toUpperCase()} — file: ${path.basename(frame.file)}`
    });
    content.push({
      type: "image_url",
      image_url: { url: dataUri, detail: "auto" }
    });
  }

  content.push({
    type: "text",
    text: `For these 6 timestamped frames, provide:

1. Per-frame description (what UI is visible at each timestamp, use the exact timestamp labels 00:00.8 etc.)
2. Differences between consecutive frames (what changed visually)
3. Visible UI states (form fields, button states, error visibility)
4. Visible validation feedback — is error "Postal code is required." visible? In which frames?
5. Inferred possible user actions — clearly labelled INFERENCE, e.g. "INFERENCE: user likely clicked Place order between 00:01.2 and 00:01.9"
6. Uncertainties / missing information that affects reliable test generation
7. Do NOT claim unseen browser interactions occurred — if not visible, say "not visible in frames"

Separate categories:
- OBSERVED: facts directly visible in a specific frame (cite frame timestamp)
- EXPECTED: the verbatim expected behaviour above (do not paraphrase)
- HYPOTHESIS: inferred defect cause or selector (label as hypothesis, include confidence)
- AMBIGUITY: missing evidence

Keep timestamps in order. If you cannot see a difference, say so. Avoid hallucinating clicks or typing not evidenced by visual change.`
  });

  const body = {
    model: MODEL,
    messages: [{ role: "user", content }],
    max_tokens: 3000,
    temperature: 0.15,
  };

  const bodyStr = JSON.stringify(body);
  console.log(`Request body: ${bodyStr.length} chars (~${(bodyStr.length/1024).toFixed(1)} KiB), ${content.length} content parts`);

  // Safety check: 8 images max, 10 MB per image, 100 MiB body — we have 6 images ~150KB each, ~1.3MB base64, ok
  if (bodyStr.length > 100 * 1024 * 1024) { console.error("Body exceeds 100 MiB"); process.exit(1); }

  const start = Date.now();
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: bodyStr,
    });
  } catch (e) {
    console.error("Fetch failed:", e.message);
    process.exit(1);
  }
  const latency = Date.now() - start;
  console.log(`HTTP ${res.status} ${res.statusText} in ${latency}ms`);

  const rawText = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(rawText); } catch { /* */ }

  const usage = parsed?.usage ?? null;
  const answer = parsed?.choices?.[0]?.message?.content ?? parsed?.choices?.[0]?.message?.reasoning_content ?? rawText.slice(0, 5000);

  const result = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    endpoint: ENDPOINT,
    manifest: MANIFEST,
    request: {
      frameCount: manifest.frames.length,
      bodyChars: bodyStr.length,
      latencyMs: latency,
    },
    response: {
      httpStatus: res.status,
      httpStatusText: res.statusText,
      latencyMs: latency,
      usage,
      finishReason: parsed?.choices?.[0]?.finish_reason ?? null,
      body: parsed ?? rawText.slice(0, 8000),
    },
    answerPreview: String(answer).slice(0, 6000),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log("--- Usage ---");
  console.log(JSON.stringify(usage, null, 2) || "(no usage)");
  console.log("--- Answer preview (truncated) ---");
  console.log(String(answer).slice(0, 4000));

  if (res.status !== 200) {
    console.log("--- Error body ---");
    console.log(rawText.slice(0, 3000));
  }

  // Quick signal checks for verification section
  const a = String(answer).toLowerCase();
  const signals = {
    preservesOrder: ["00:00.8","00:01.2","00:01.9","00:02.0","00:02.4","00:02.8"].every(ts => a.includes(ts.toLowerCase())),
    mentionsPostal: a.includes("postal"),
    mentionsErrorVisible: a.includes("postal code is required"),
    mentionsCheckoutUI: a.includes("checkout") && a.includes("place order"),
    mentionsInferenceLabel: a.includes("inference"),
    mentionsUncertainty: a.includes("uncertain") || a.includes("missing") || a.includes("not visible"),
    avoidsHallucination: !a.includes("clicked on 00:00.8") // crude check
  };
  console.log("--- Signal checks ---");
  console.log(signals);
  fs.writeFileSync("test-results/probe-multiframe-signals.json", JSON.stringify(signals, null, 2), "utf8");
}

main().catch(e => { console.error(e); process.exit(1); });
