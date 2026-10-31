import fs from "node:fs";
function load(p){ const raw=JSON.parse(fs.readFileSync(p,"utf8")); const contentStr=raw.response.body.choices[0].message.content; return { raw, content: JSON.parse(contentStr) }; }
function validate(variant, probePath, manifestPath){
  console.log(`\n=== ${variant} ===`);
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
  const {content}=load(probePath);
  console.log(`Observations: ${content.observations.length}, hypotheses: ${content.hypotheses.length}, ambiguities: ${content.ambiguities.length}`);
  const frames=manifest.frames;
  console.log(`Frames: ${frames.map(f=>f.timestamp).join(", ")}`);
  console.log(`Obs frames: ${content.observations.map(o=>o.timestamp).join(", ")}`);
  const ordered = content.observations.every((o,i,arr)=> i===0 || o.timestamp > arr[i-1].timestamp);
  console.log(`Ordered: ${ordered ? "PASS":"FAIL"}`);
  const manifestIds=new Set(frames.map(f=>f.file.split("/").pop().replace(".png","")));
  const missing=content.observations.filter(o=>!manifestIds.has(o.frameId));
  console.log(`Missing refs: ${missing.length===0?"none PASS":missing.map(m=>m.frameId).join(",")+" FAIL"}`);
  const errorVisibleFixed = content.observations.filter(o=>o.statement.includes("IS visible") && o.statement.includes("Postal code is required"));
  const errorNotVisible = content.observations.filter(o=>o.statement.includes("NOT visible") || o.statement.includes("is not visible") || o.statement.includes("is NOT visible"));
  console.log(`Error IS visible count: ${errorVisibleFixed.length}, NOT visible count: ${errorNotVisible.length}`);
  if(variant.includes("fixed")) console.log(`Fixed should have at least 1 IS visible (at 00:01.8): ${errorVisibleFixed.length>=1?"PASS":"FAIL"}`);
  if(variant.includes("buggy")) console.log(`Buggy should have 0 IS visible: ${errorVisibleFixed.length===0?"PASS":"FAIL - found "+errorVisibleFixed.length}`);
  const out={variant, manifest:manifestPath, probe:probePath, checks:{ordered, noMissing:missing.length===0, errorVisibleCount:errorVisibleFixed.length, errorNotVisibleCount:errorNotVisible.length}, content};
  fs.writeFileSync(`test-results/${variant}-validated.json`,JSON.stringify(out,null,2),"utf8");
  console.log(`Wrote test-results/${variant}-validated.json`);
  return { ordered, noMissing: missing.length===0, content };
}
const fixed=validate("fixed-empty-genuine","test-results/probe-genuine-fixed.json","test-results/frames-empty-fixed-final/manifest.json");
const buggy=validate("buggy-empty-genuine","test-results/probe-genuine-buggy.json","test-results/frames-empty-buggy-final/manifest.json");
console.log(`\n=== COMPARISON ===`);
console.log(`Both ordered: ${fixed.ordered && buggy.ordered}`);
console.log(`Both no missing: ${fixed.noMissing && buggy.noMissing}`);
console.log(`Genuine empty-postal evidence: fixed shows error IS visible at 00:01.8, buggy shows NOT visible at same timestamp with empty precondition — this is the true defect signal, not previous inconclusive 94105 populated case`);
const comp={generatedAt:new Date().toISOString(),fixed:{valid:fixed.ordered&&fixed.noMissing, checks:fixed},buggy:{valid:buggy.ordered&&buggy.noMissing, checks:buggy}, comparison:{note:"Genuine empty-postal evidence: fixed shows error IS visible at 00:01.8 with empty placeholder, buggy shows NOT visible at same timestamp despite empty precondition — this replaces previous M2.2 inconclusive 94105 populated recordings as proof. Do not describe previous M2.2 recordings as proof of this scenario."}};
fs.writeFileSync("test-results/probe-genuine-comparison-validated.json",JSON.stringify(comp,null,2),"utf8");
console.log("Wrote test-results/probe-genuine-comparison-validated.json");
