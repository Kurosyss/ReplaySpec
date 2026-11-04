import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const projectDir = path.join(root, "pitch-video");
const assetsDir = path.join(projectDir, "assets");
const outputDir = path.join(projectDir, "output");
const scratchDir = path.join(projectDir, ".render");
const width = 1920;
const height = 1080;
const fps = 30;
const ffmpeg = "C:/Users/Administrator/AppData/Local/Programs/Python/Python314/Scripts/ffmpeg.exe";
const ffprobe = "C:/Users/Administrator/AppData/Local/Programs/Python/Python314/Scripts/ffprobe.exe";

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(scratchDir, { recursive: true });

const imageData = (relativePath) => {
  const data = fs.readFileSync(path.join(root, relativePath));
  const ext = path.extname(relativePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${data.toString("base64")}`;
};

const asset = {
  home: imageData("pitch-video/assets/product-home.png"),
  investigations: imageData("pitch-video/assets/product-investigations.png"),
  recording: imageData("pitch-video/assets/product-recording.png"),
  evidence: imageData("pitch-video/assets/product-evidence.png"),
  cartBuggy: imageData("pitch-video/assets/cart-buggy-2.png"),
  cartFixed: imageData("pitch-video/assets/cart-fixed-3.png"),
};

const sceneCopy = [
  { label: "01 / THE GAP", caption: "A bug is easy to capture; proving the fix is the hard part." },
  { label: "02 / TRACE THE MOMENT", caption: "ReplaySpec turns that clip into timestamped evidence, a regression check, and a Chromium verdict." },
  { label: "03 / KEEP CLAIMS GROUNDED", caption: "Observations stay tied to their frames; expectations, model hypotheses, and uncertainty remain distinct." },
  { label: "04 / AI ASSISTS, CHROMIUM VERIFIES", caption: "Optional Meta Llama 4 vision helps review selected frames; a constrained browser check decides the verdict." },
  { label: "05 / THE CART RACE", caption: "Two cart clicks should move quantity from one to three; the buggy run stops at two, and the fixed run reaches three." },
  { label: "06 / THREE CURATED CASES", caption: "Three curated cases cover checkout validation, a cart race, and a blocked modal cancel." },
  { label: "07 / HONEST PROTOTYPE SCOPE", caption: "Runs stay within bundled demo routes and local file storage; checkout collects no payment." },
  { label: "08 / REPLAYSPEC", caption: "ReplaySpec: browser evidence, connected to repeatable regression proof." },
];

const sourceVoiceFiles = sceneCopy.map((_, i) => path.join(assetsDir, `voice-${String(i + 1).padStart(2, "0")}.wav`));
const voiceFiles = [];
const voiceDurations = [];
for (let i = 0; i < sourceVoiceFiles.length; i += 1) {
  const trimmedPath = path.join(scratchDir, `voice-${String(i + 1).padStart(2, "0")}-trim-slow.wav`);
  await execFileAsync(ffmpeg, [
    "-y", "-i", sourceVoiceFiles[i], "-af",
    "areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB,atempo=0.90",
    "-c:a", "pcm_s16le", trimmedPath,
  ]);
  voiceFiles.push(trimmedPath);
  const result = await execFileAsync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", trimmedPath]);
  voiceDurations.push(Number(result.stdout.trim()));
}
const sceneLead = 0.3;
const sceneGap = 0.5;
let voiceCursor = sceneLead;
const scenes = sceneCopy.map((scene, i) => {
  const voiceStart = voiceCursor;
  const start = voiceStart - sceneLead;
  voiceCursor += voiceDurations[i] + sceneGap;
  return { ...scene, start, voiceStart, voiceDuration: voiceDurations[i], duration: voiceDurations[i] + sceneGap };
});
const duration = Math.ceil(voiceCursor - sceneGap + 2.6);
const toSrtTime = (seconds) => {
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};

async function buildNarration() {
  const wavPath = path.join(assetsDir, "narration.wav");
  const wavTempPath = path.join(assetsDir, "narration-concat.wav");
  const audioArgs = ["-y", "-f", "lavfi", "-t", String(sceneLead), "-i", "anullsrc=channel_layout=mono:sample_rate=22050"];
  const concatEntries = [];
  const audioFilters = ["[0:a]aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono[lead]"];
  concatEntries.push("[lead]");
  for (let i = 0; i < voiceFiles.length; i += 1) {
    audioArgs.push("-i", voiceFiles[i]);
    const inputIndex = i * 2 + 1;
    audioFilters.push(`[${inputIndex}:a]aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono[v${i}]`);
    concatEntries.push(`[v${i}]`);
    if (i < voiceFiles.length - 1) {
      const silenceIndex = i * 2 + 2;
      audioArgs.push("-f", "lavfi", "-t", String(sceneGap), "-i", "anullsrc=channel_layout=mono:sample_rate=22050");
      const silenceLabel = `gap${i}`;
      audioFilters.push(`[${silenceIndex}:a]aformat=sample_fmts=s16:sample_rates=22050:channel_layouts=mono[${silenceLabel}]`);
      concatEntries.push(`[${silenceLabel}]`);
    }
  }
  audioArgs.push(
    "-filter_complex", `${audioFilters.join(";")};${concatEntries.join("")}concat=n=${concatEntries.length}:v=0:a=1[aout]`,
    "-map", "[aout]", "-c:a", "pcm_s16le", "-ar", "22050", "-ac", "1", wavTempPath,
  );
  await execFileAsync(ffmpeg, audioArgs, { maxBuffer: 4 * 1024 * 1024 });
  fs.rmSync(wavPath, { force: true });
  fs.renameSync(wavTempPath, wavPath);
  return wavPath;
}

const wavPath = await buildNarration();
if (process.argv.includes("--audio-only")) {
  console.log(`Built narration at ${wavPath}`);
  process.exit(0);
}

const brandMark = `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4 3.5 8v8l7 4V4Z" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M13.5 4 20.5 8v8l-7 4V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-dasharray="2.5 1.5"/><path d="m12 10 2 2-2 2-2-2 2-2Z" fill="#315FEA"/></svg>`;
const frame = (src, alt, extra = "") => `<figure class="frame ${extra}"><img src="${src}" alt="${alt}"/></figure>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#f6f7fb;color:#111827;font-family:Inter,"Segoe UI",Arial,sans-serif}body{position:relative}
.paper{position:absolute;inset:0;background-image:radial-gradient(#a9b5ce 0.75px,transparent 0.75px);background-size:26px 26px;opacity:.14;mask-image:linear-gradient(110deg,transparent,#000 30%,#000 82%,transparent)}
.rail{position:absolute;inset:0 0 auto;height:110px;border-bottom:2px solid #dfe4ed;display:flex;align-items:center;justify-content:space-between;padding:0 96px;z-index:10;background:rgba(246,247,251,.86)}
.brand{display:flex;align-items:center;gap:18px;font-weight:680;letter-spacing:-1.4px;font-size:30px}.mark{width:34px;height:34px;color:#111827}.meta{font:600 17px "JetBrains Mono",Consolas,monospace;letter-spacing:1.4px;color:#73819a}.accent{color:#315fea}.scenes{position:absolute;inset:110px 0 0}
.scene{position:absolute;inset:0;padding:78px 112px 166px;opacity:0;background:#f6f7fb;animation:scene-in .42s cubic-bezier(.2,.8,.2,1) var(--start) both}
@keyframes scene-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.eyebrow{font:600 17px "JetBrains Mono",Consolas,monospace;letter-spacing:2.3px;text-transform:uppercase;color:#315fea;margin:0 0 28px}.scene h1,.scene h2{margin:0;font-weight:620;letter-spacing:-5px;line-height:.98}.scene h1{font-size:100px}.scene h2{font-size:76px}.serif{font-family:Georgia,"Times New Roman",serif;font-weight:400!important;font-style:italic;letter-spacing:-4px!important;color:#315fea}.bodycopy{font-size:30px;line-height:1.45;color:#46536a;max-width:760px}.scene-grid{display:grid;grid-template-columns:1fr 1fr;gap:76px;align-items:center;height:100%}
.frame{position:relative;margin:0;overflow:hidden;border:2px solid #d9dfeb;border-radius:22px;background:#eef1f6;box-shadow:0 24px 70px rgba(23,38,69,.12)}.frame img{display:block;width:100%;height:100%;object-fit:contain;background:#eef1f6}
.hero-shot{height:450px}.shot-tall{height:455px}.shot-wide{height:455px}.overprint{position:absolute;left:auto;right:136px;top:106px;background:#fff;padding:12px 16px;border-radius:999px;border:1px solid #dfe4ed;font:600 15px "JetBrains Mono",Consolas,monospace;color:#53627b}
.foot{position:absolute;left:112px;right:112px;bottom:28px;display:flex;justify-content:space-between;align-items:end;border-top:2px solid #d9dfeb;padding-top:12px;color:#6d7b94;font:14px "JetBrains Mono",Consolas,monospace}.caption{position:absolute;left:50%;bottom:88px;transform:translateX(-50%);width:max-content;max-width:1320px;padding:11px 18px;border-radius:5px;background:rgba(18,31,54,.96);color:#f8faff;text-align:center;font-size:21px;line-height:1.32;box-shadow:0 5px 18px rgba(12,22,42,.12);opacity:0;animation:subtitle-in .16s ease var(--voice-start) both}.foot .project{color:#13213b}
@keyframes subtitle-in{from{opacity:0}to{opacity:1}}
.pipeline{display:grid;grid-template-columns:repeat(5,1fr);align-items:center;gap:0;margin-top:72px}.step{position:relative;min-height:170px;padding:27px 20px 18px 24px;border-top:3px solid #17233b;border-bottom:1px solid #d9dfeb;opacity:0;animation:step-in .34s cubic-bezier(.2,.8,.2,1) calc(var(--start) + var(--step-delay)) both}.step:not(:last-child):after{content:"→";position:absolute;right:-20px;top:56px;color:#315fea;font:42px Georgia,serif;z-index:2}.step-no{font:16px "JetBrains Mono",Consolas,monospace;color:#8190a8}.step-title{display:block;margin-top:20px;font-size:25px;font-weight:650;letter-spacing:-.5px}.step-note{display:block;margin-top:7px;font:16px "JetBrains Mono",Consolas,monospace;color:#74829b}@keyframes step-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.taxonomy{display:grid;grid-template-columns:.95fr 1.05fr;gap:80px;align-items:center;height:100%}.terms{border-top:2px solid #17233b}.term{display:grid;grid-template-columns:270px 1fr;align-items:center;padding:24px 0;border-bottom:1px solid #d9dfeb}.term strong{font:700 20px "JetBrains Mono",Consolas,monospace;letter-spacing:1px}.term span{font-size:25px;color:#53627b}.obs{color:#315fea}.exp{color:#18233a}.hyp{color:#7958bd}.amb{color:#8793a7}
.contract{display:flex;align-items:center;gap:32px;margin-top:48px;padding:30px 34px;border:2px solid #d7e1ff;border-left:8px solid #315fea;background:#edf2ff;border-radius:5px}.contract .big{font:700 38px "JetBrains Mono",Consolas,monospace;color:#14213a}.contract .small{font-size:24px;color:#54627a;line-height:1.35}
.compare{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:28px}.compare .frame{width:min(100%,600px);height:auto;aspect-ratio:800/650;margin-inline:auto}.compare-label{display:flex;justify-content:space-between;margin:0 0 12px;font:700 18px "JetBrains Mono",Consolas,monospace;letter-spacing:1.3px}.buggy{color:#ca3e47}.fixed{color:#147d59}.resultline{display:flex;align-items:center;justify-content:space-between;margin-top:17px;font-size:21px;color:#53627b}.resultline b{font:700 27px "JetBrains Mono",Consolas,monospace;color:#16233b}
.cases{display:grid;grid-template-columns:1.05fr .95fr;gap:58px;align-items:center}.case-list{border-top:2px solid #17233b}.case{display:grid;grid-template-columns:82px 1fr auto;align-items:center;gap:18px;padding:24px 0;border-bottom:1px solid #d9dfeb}.case .id{font:600 18px "JetBrains Mono",Consolas,monospace;color:#8b97ac}.case strong{font-size:26px;font-weight:620}.status{font:600 14px "JetBrains Mono",Consolas,monospace;letter-spacing:.8px}.green{color:#157b54}.red{color:#c53941}
.guard{display:grid;grid-template-columns:.9fr 1.1fr;gap:76px;align-items:center;height:100%}.guardrail{display:flex;align-items:center;gap:18px;padding:19px 0;border-bottom:1px solid #d9dfeb;font:22px "JetBrains Mono",Consolas,monospace}.node{height:18px;width:18px;border-radius:50%;background:#315fea;box-shadow:0 0 0 9px #e6ecff}.scope-map{border-top:2px solid #17233b;border-bottom:1px solid #d9dfeb;padding:6px 0}.scope-title{font:600 16px "JetBrains Mono",Consolas,monospace;letter-spacing:1.4px;color:#71809a}.scope-step{display:grid;grid-template-columns:210px 1fr;gap:8px 20px;padding:22px 0;border-bottom:1px solid #d9dfeb}.scope-step:last-child{border-bottom:0}.scope-step small{grid-row:span 2;font:600 14px "JetBrains Mono",Consolas,monospace;letter-spacing:.8px;color:#315fea}.scope-step strong{font-size:25px;font-weight:630;letter-spacing:-.5px}.scope-step span{font:17px "JetBrains Mono",Consolas,monospace;color:#6d7b94}.scope-note{margin-top:20px;max-width:700px;font-size:19px;line-height:1.45;color:#53627b}
.close-title{font-size:122px!important;max-width:1280px}.close-mark{display:flex;align-items:center;gap:18px;font-weight:700;font-size:30px;letter-spacing:-1px;margin-top:32px}.scope{margin-top:42px;font:17px "JetBrains Mono",Consolas,monospace;letter-spacing:.7px;color:#6b7890}
.progress{position:absolute;left:0;bottom:0;height:8px;width:100%;background:#e1e6ef;z-index:11}.progress i{display:block;height:100%;width:100%;background:#315fea;transform-origin:left;animation:progress ${duration}s linear both}
@keyframes progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
</style></head><body><div class="paper"></div><header class="rail"><div class="brand">${brandMark}<span>ReplaySpec</span></div><div class="meta">EVIDENCE <span class="accent">/</span> REGRESSION <span class="accent">/</span> CHROMIUM</div></header><main class="scenes">
<section class="scene" style="--start:${scenes[0].start}s;--dur:${scenes[0].duration}s;--voice-start:${scenes[0].voiceStart}s"><div class="scene-grid"><div><p class="eyebrow">A browser investigation studio</p><h1>The clip captures<br/>the <span class="serif">moment.</span></h1><p class="bodycopy" style="margin-top:32px">A testable verdict tells you whether the fix holds.</p></div>${frame(asset.home,"ReplaySpec home page and real cart evidence preview","hero-shot")}<div class="overprint">PRODUCT / BROWSER EVIDENCE</div></div>${caption(scenes[0])}${footer(scenes[0])}</section>
<section class="scene" style="--start:${scenes[1].start}s;--dur:${scenes[1].duration}s;--voice-start:${scenes[1].voiceStart}s"><p class="eyebrow">From clip to a repeatable investigation</p><h2>Keep every step <span class="serif">inspectable.</span></h2><div class="pipeline"><div class="step" style="--step-delay:.10s"><span class="step-no">01</span><strong class="step-title">Recording</strong><span class="step-note">browser capture</span></div><div class="step" style="--step-delay:.17s"><span class="step-no">02</span><strong class="step-title">Frames</strong><span class="step-note">timestamped</span></div><div class="step" style="--step-delay:.24s"><span class="step-no">03</span><strong class="step-title">Evidence</strong><span class="step-note">frame-linked</span></div><div class="step" style="--step-delay:.31s"><span class="step-no">04</span><strong class="step-title">Specification</strong><span class="step-note">constrained</span></div><div class="step" style="--step-delay:.38s"><span class="step-no">05</span><strong class="step-title">Verdict</strong><span class="step-note">real Chromium</span></div></div>${caption(scenes[1])}${footer(scenes[1])}</section>
<section class="scene" style="--start:${scenes[2].start}s;--dur:${scenes[2].duration}s;--voice-start:${scenes[2].voiceStart}s"><div class="taxonomy"><div><p class="eyebrow">Evidence is not a guess</p><h2>Different claims.<br/><span class="serif">Different weight.</span></h2><div class="terms"><div class="term"><strong class="obs">OBSERVED</strong><span>What a source frame shows</span></div><div class="term"><strong class="exp">EXPECTED</strong><span>The behavior the user specified</span></div><div class="term"><strong class="hyp">HYPOTHESIS</strong><span>A cause to investigate</span></div><div class="term"><strong class="amb">AMBIGUITY</strong><span>What the evidence cannot settle</span></div></div></div>${frame(asset.evidence,"Uncropped ReplaySpec evidence view with timestamps and frame-grounded observations","shot-tall")}</div>${caption(scenes[2])}${footer(scenes[2])}</section>
<section class="scene" style="--start:${scenes[3].start}s;--dur:${scenes[3].duration}s;--voice-start:${scenes[3].voiceStart}s"><div class="scene-grid"><div><p class="eyebrow">Optional multimodal review</p><h2>AI can inspect.<br/><span class="serif">Chromium decides.</span></h2><div class="contract"><span class="big">LLAMA 4</span><span class="small">Meta Llama 4 Maverick · OpenRouter · paid</span></div><p class="bodycopy" style="margin-top:23px;font-size:23px">Frame analysis can suggest evidence; the constrained Playwright check decides the verdict.</p><p class="bodycopy" style="margin-top:13px;font-size:20px">Schema-validated output. Model-written source never executes.</p></div>${frame(asset.recording,"ReplaySpec recording workspace with defect verdict and frame-grounded evidence","shot-tall")}</div>${caption(scenes[3])}${footer(scenes[3])}</section>
<section class="scene" style="--start:${scenes[4].start}s;--dur:${scenes[4].duration}s;--voice-start:${scenes[4].voiceStart}s"><p class="eyebrow">BUG-02 / cart counter race</p><h2>One click goes <span class="serif">missing.</span></h2><div class="compare"><div><div class="compare-label"><span class="buggy">BUGGY</span><span>Observed: 2</span></div>${frame(asset.cartBuggy,"Complete buggy cart state after two quick increments, quantity remains two")}</div><div><div class="compare-label"><span class="fixed">FIXED</span><span>Verified: 3</span></div>${frame(asset.cartFixed,"Complete fixed cart state after two quick increments, quantity reaches three")}</div></div><div class="resultline"><span>Same two clicks. Different outcome.</span><b>1 → 3</b></div>${caption(scenes[4])}${footer(scenes[4])}</section>
<section class="scene" style="--start:${scenes[5].start}s;--dur:${scenes[5].duration}s;--voice-start:${scenes[5].voiceStart}s"><div class="cases"><div><p class="eyebrow">Three curated browser regressions</p><h2>One inspectable<br/><span class="serif">workflow.</span></h2><p class="bodycopy" style="margin-top:28px">Checkout validation. Cart counter race. Modal cancel overlay.</p><p class="scope">FRAME EVIDENCE · SPECIFICATION · CHROMIUM VERDICT</p></div>${frame(asset.investigations,"Uncropped investigations list showing all three curated cases and their verdicts","shot-wide")}</div>${caption(scenes[5])}${footer(scenes[5])}</section>
<section class="scene" style="--start:${scenes[6].start}s;--dur:${scenes[6].duration}s;--voice-start:${scenes[6].voiceStart}s"><div class="guard"><div><p class="eyebrow">Honest prototype scope</p><h2>Focused by design.<br/><span class="serif">Clear about limits.</span></h2><div class="guardrail"><i class="node"></i><span>Bundled demo routes only</span></div><div class="guardrail"><i class="node"></i><span>Local file-backed records</span></div><div class="guardrail"><i class="node"></i><span>No real checkout or payment</span></div></div><div><p class="scope-title">DATA PATH / OPTIONAL MODEL REVIEW</p><div class="scope-map"><div class="scope-step"><small>01 / INPUT</small><strong>Selected frames + prompt</strong><span>From the recording under review</span></div><div class="scope-step"><small>02 / VISION</small><strong>Configured model provider</strong><span>Meta Llama 4 Maverick · OpenRouter · paid</span></div><div class="scope-step"><small>03 / VERIFICATION</small><strong>Allowlisted browser check</strong><span>Deterministic Chromium result</span></div></div><p class="scope-note">Model suggestions remain separate from observations and do not become executable source.</p></div></div>${caption(scenes[6])}${footer(scenes[6])}</section>
<section class="scene" style="--start:${scenes[7].start}s;--dur:${scenes[7].duration}s;--voice-start:${scenes[7].voiceStart}s"><p class="eyebrow">Browser evidence → regression proof</p><h1 class="close-title">ReplaySpec<br/><span class="serif">From frame to proof.</span></h1><div class="close-mark">${brandMark}<span>ReplaySpec</span></div><p class="scope">LOCAL PROTOTYPE · BUNDLED CHROMIUM DEMOS · NO REAL CHECKOUT OR PAYMENT</p>${caption(scenes[7])}${footer(scenes[7])}</section>
</main><div class="progress"><i></i></div></body></html>`;

function caption(scene) {
  return `<div class="caption">${scene.caption}</div>`;
}
function footer(scene) {
  return `<div class="foot"><span class="project">REPLAYSPEC / META GLOBAL AI DEVELOPER HACKATHON 2026</span><span>${scene.label}</span></div>`;
}

const webmDir = path.join(scratchDir, "browser");
fs.mkdirSync(webmDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  recordVideo: { dir: webmDir, size: { width, height } },
});
const page = await context.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout((duration + 0.6) * 1000);
const video = page.video();
await context.close();
await browser.close();
const webmPath = await video.path();

const mp4Path = path.join(outputDir, "replayspec-pitch.mp4");
await execFileAsync(ffmpeg, [
  "-y", "-i", webmPath, "-i", wavPath,
  "-filter:v", `fps=${fps},scale=${width}:${height}:flags=lanczos,format=yuv420p`,
  "-c:v", "libx264", "-preset", "medium", "-crf", "19",
  "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
  "-t", String(duration), "-movflags", "+faststart", mp4Path,
], { maxBuffer: 4 * 1024 * 1024 });

const probe = await execFileAsync(ffprobe, ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height,r_frame_rate", "-of", "json", mp4Path]);
fs.writeFileSync(path.join(outputDir, "metadata.json"), JSON.stringify(JSON.parse(probe.stdout), null, 2));
const subtitle = scenes.map((scene, index) => {
  const start = toSrtTime(scene.voiceStart);
  const end = toSrtTime(scene.voiceStart + scene.voiceDuration);
  return `${index + 1}\n${start} --> ${end}\n${scene.caption}`;
}).join("\n\n") + "\n";
fs.writeFileSync(path.join(outputDir, "replayspec-pitch.en.srt"), subtitle, "utf8");
fs.rmSync(scratchDir, { recursive: true, force: true });
console.log(`Rendered ${mp4Path}`);
console.log(probe.stdout);
