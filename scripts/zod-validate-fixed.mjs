import fs from "node:fs";
import { EvidenceBundleSchema, checkNoSilentPromotion } from "../src/lib/evidence.ts";

const variant = process.argv[2] || "fixed";
const manifest = JSON.parse(fs.readFileSync(`test-results/frames-bug01-${variant}/manifest.json`, "utf8"));
const probe = JSON.parse(fs.readFileSync(`test-results/probe-m2.2-${variant}.json`, "utf8"));
const contentStr = probe.response.body.choices[0].message.content;
const content = JSON.parse(contentStr);

const frames = manifest.frames.map(f=>({
  frameId: f.file.split("/").pop().replace(".png",""),
  timestamp: f.timestamp,
  timestampSeconds: f.timestampSeconds,
  file: f.file,
  format: "png",
  width: f.width,
  height: f.height,
  bytes: f.bytes,
  mimeType: f.mimeType,
  sourceVideo: manifest.sourceVideo,
}));

const expected = { kind:"expected", id:"exp-1", statement:'Submitting without postal code must display "Postal code is required."', rawUserInput:'Submitting without postal code must display "Postal code is required."' };

const bundle = {
  sourceVideo: manifest.sourceVideo,
  frames,
  observations: content.observations.map(o=>({ ...o, kind:"observation" })),
  expectedBehaviours: [expected],
  hypotheses: content.hypotheses.map(h=>({ ...h, kind:"hypothesis" })),
  ambiguities: content.ambiguities.map(a=>({ ...a, kind:"ambiguity" })),
};

const result = EvidenceBundleSchema.safeParse(bundle);
console.log(`${variant} Zod valid:`, result.success);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
} else {
  console.log(`${variant} silent promotion violations:`, checkNoSilentPromotion(result.data));
  console.log(`${variant} observations:`, result.data.observations.length, "hypotheses:", result.data.hypotheses.length, "ambiguities:", result.data.ambiguities.length);
  console.log(`${variant} frames strictly increasing:`, frames[1].timestampSeconds > frames[0].timestampSeconds);
}
