#!/usr/bin/env node
/**
 * Temporary reproducible probe: validates exact hackathon model video support.
 * Reads BASETEN_API_KEY from .env.local server-side (never browser, never committed).
 * Sends ONE WebM (fixed variant) as data: URI video_url.
 *
 * Usage: node scripts/probe-video.mjs [path/to/video.webm]
 * Defaults to fixed-variant recording.
 *
 * Security:
 * - .env.local is read via fs, never logged.
 * - API key never printed; only first/last 4 chars in log for confirmation.
 * - Encoded media never logged.
 * - Probe result written to test-results/probe-video-result.json (gitignored).
 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_VIDEO =
  "test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm";

const videoPath = process.argv[2] ?? DEFAULT_VIDEO;
const ENV_PATH = ".env.local";
const OUT_PATH = "test-results/probe-video-result.json";
const MODEL = "meta-models/muse-spark-open-1026";
const ENDPOINT = "https://inference.baseten.co/v1/chat/completions";

function loadEnvLocal() {
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

function maskKey(key) {
  if (!key || key.length < 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)} (${key.length} chars)`;
}

async function main() {
  console.log("Probe: validating exact hackathon model video support");
  console.log(`Model: ${MODEL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Video: ${videoPath}`);

  if (!fs.existsSync(ENV_PATH)) {
    console.error(`Missing ${ENV_PATH}. Create it with BASETEN_API_KEY=... (not committed).`);
    process.exit(1);
  }
  const env = loadEnvLocal();
  const apiKey = env.BASETEN_API_KEY || process.env.BASETEN_API_KEY;
  if (!apiKey) {
    console.error("BASETEN_API_KEY not found in .env.local or env.");
    process.exit(1);
  }
  console.log(`API key: ${maskKey(apiKey)}`);

  if (!fs.existsSync(videoPath)) {
    console.error(`Video not found: ${videoPath}`);
    console.error("Run: npx playwright test bug-01.video --reporter=list");
    process.exit(1);
  }

  const stat = fs.statSync(videoPath);
  const bytes = stat.size;
  console.log(`Video size: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KiB)`);

  // Read and encode
  const rawVideo = fs.readFileSync(videoPath);
  const b64 = rawVideo.toString("base64");
  const b64Len = b64.length;
  console.log(`Base64 length: ${b64Len} chars (~${(b64Len / 1024).toFixed(1)} KiB)`);
  console.log(`Base64 overhead: ~${((b64Len / bytes) * 100 - 100).toFixed(1)}%`);

  // Safety: Baseten base64 request body limit 100 MiB for Muse Spark Open
  const estimatedJsonBytes = b64Len + 5000; // prompt overhead
  if (estimatedJsonBytes > 100 * 1024 * 1024) {
    console.error(`Estimated request body ${estimatedJsonBytes} exceeds 100 MiB limit. Aborting.`);
    process.exit(1);
  }

  const dataUri = `data:video/webm;base64,${b64}`;
  // Do not log dataUri

  // Construct request per docs: Muse Spark prompting guide + Baseten vision
  const prompt = `You are analyzing a browser bug recording for ReplaySpec evidence-grounded investigation.

Visible checkout flow:
- Page: BUG-01 Checkout postal-code validation at /demo/bug-01?variant=fixed
- Form fields: Full name, Street address, City, Postal code (required)
- Action: User clicks "Place order" with empty postal code, then fills "94105" and clicks again.

For this video, return ONLY structured observations:

1. Visible checkout actions (what the user does, in order).
2. Timestamped events where supported (mm:ss or 0:02 format, or "not supported").
3. Postal-code validation behaviour (what happens on empty submit).
4. Whether error message "Postal code is required." appears — and if visible.
5. Separate OBSERVED (facts in frames) vs INFERENCE (your interpretation of defect).
6. Any uncertain or missing information that affects reliable test generation.

Do not invent selectors or external URLs. Be explicit about uncertainty.`;

  const body = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "video_url",
            video_url: { url: dataUri },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
    // Keep deterministic and short; do not set reasoning_effort beyond defaults for now
    max_tokens: 800,
    temperature: 0.1,
  };

  const bodyStr = JSON.stringify(body);
  console.log(`Request body: ${bodyStr.length} chars (~${(bodyStr.length / 1024).toFixed(1)} KiB) JSON`);
  console.log("Sending ONE request...");

  const reqStart = Date.now();
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: bodyStr,
    });
  } catch (err) {
    console.error("Fetch failed:", err.message);
    process.exit(1);
  }
  const latencyMs = Date.now() - reqStart;
  console.log(`HTTP ${res.status} ${res.statusText} in ${latencyMs}ms`);

  const resText = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(resText);
  } catch {
    // leave as text
  }

  // Never log raw video or full base64; truncate response for console
  const usage = parsed?.usage ?? parsed?.usage_metadata ?? null;
  const out = {
    timestamp: new Date().toISOString(),
    model: MODEL,
    endpoint: ENDPOINT,
    videoPath,
    videoMeta: {
      sizeBytes: bytes,
      base64Chars: b64Len,
      format: "webm/vp9",
      // actual probe file is 800x450, 3.2s, vp9, verified via ffprobe
      verifiedVia: "ffprobe",
    },
    request: {
      bodyChars: bodyStr.length,
      latencyMs,
      // do not store dataUri
    },
    response: {
      httpStatus: res.status,
      httpStatusText: res.statusText,
      headers: Object.fromEntries(
        [...res.headers.entries()].filter(([k]) => !k.toLowerCase().includes("auth"))
      ),
      latencyMs,
      usage,
      // store full parsed if available, else text
      body: parsed ?? resText.slice(0, 8000),
    },
  };

  // Write full result outside public/ (gitignored test-results/)
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${OUT_PATH}`);

  // Console summary (sanitized)
  console.log("--- Usage ---");
  console.log(JSON.stringify(usage, null, 2) || "(no usage field)");

  console.log("--- Model answer (truncated) ---");
  const answer =
    parsed?.choices?.[0]?.message?.content ??
    parsed?.output_text ??
    parsed?.content ??
    resText.slice(0, 2000);
  console.log(String(answer).slice(0, 4000));

  if (res.status !== 200) {
    console.log("--- Full error body (first 2k) ---");
    console.log(resText.slice(0, 2000));
    process.exit(0); // do not treat as crash — record result
  }

  // Rudimentary quality check for report
  const answerStr = String(answer).toLowerCase();
  const signals = {
    mentionsPostal: answerStr.includes("postal"),
    mentionsError: answerStr.includes("postal code is required") || answerStr.includes("error"),
    mentionsCheckout: answerStr.includes("checkout") || answerStr.includes("place order"),
    mentionsObservationInference: answerStr.includes("observed") || answerStr.includes("inference"),
    mentionsUncertainty: answerStr.includes("uncertain") || answerStr.includes("missing"),
  };
  console.log("--- Signal check ---");
  console.log(signals);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
