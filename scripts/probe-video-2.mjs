import fs from "node:fs";

const VIDEO = process.argv[2] ?? "test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm";
const MODEL = "meta-models/muse-spark-open-1026";
const ENDPOINT = "https://inference.baseten.co/v1/chat/completions";
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
const apiKey = loadEnv().BASETEN_API_KEY;
const raw = fs.readFileSync(VIDEO);
const b64 = raw.toString("base64");
const dataUri = `data:video/webm;base64,${b64}`;
console.log(`video ${VIDEO} ${raw.length} bytes b64 ${b64.length}`);
const prompt = `Analyze this browser screen recording. The page is BUG-01 Checkout postal-code validation.

Task: List what you SEE in the video frames in order:
- Initial page load
- Form fields present
- User clicking Place order with empty postal code
- Whether red error "Postal code is required." appears and is visible
- Second submit with postal 94105

Be explicit: say "I can see video frames" or "I cannot view video". If you can see, give timestamps like 0:01, 0:02 or state not supported. Separate OBSERVED vs INFERENCE.`;

const body = {
  model: MODEL,
  messages: [{ role: "user", content: [{ type: "video_url", video_url: { url: dataUri } }, { type: "text", text: prompt }] }],
  max_tokens: 2500,
  temperature: 0.2,
  // try without reasoning_effort to allow default xhigh 512 to complete
};

const start = Date.now();
const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
const latency = Date.now() - start;
console.log(`HTTP ${res.status} ${res.statusText} ${latency}ms`);
const text = await res.text();
console.log(text.slice(0, 8000));
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync("test-results/probe-video-result-2.json", JSON.stringify({ status: res.status, latency, body: text.slice(0, 15000) }, null, 2));
console.log("wrote test-results/probe-video-result-2.json");
