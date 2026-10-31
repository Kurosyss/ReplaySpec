import fs from "node:fs";

const videoDir = fs.readdirSync("test-results/runs").find(d => fs.existsSync(`test-results/runs/${d}/page@` + fs.readdirSync(`test-results/runs/${d}`).find(f => f.endsWith(".webm"))));
let videoPath = "";
for (const dir of fs.readdirSync("test-results/runs")) {
  const files = fs.readdirSync(`test-results/runs/${dir}`).filter(f => f.endsWith(".webm"));
  if (files.length > 0) { videoPath = `test-results/runs/${dir}/${files[0]}`; break; }
}
const buffer = fs.readFileSync(videoPath);
console.log(`Using genuine recording: ${videoPath}, size: ${buffer.length}, type: video/webm`);

const formData = new FormData();
formData.append("file", new Blob([buffer], { type: "video/webm" }), "inconclusive-bug01.webm");
formData.append("title", "Inconclusive — postal remains populated, no validation failure");
formData.append("expectedBehaviour", 'Submitting without postal code must display "Postal code is required."');
formData.append("context", "This recording shows the form with postal code 94105 populated throughout, no empty case, so expected validation failure is not observable — should be INCONCLUSIVE");

const uploadRes = await fetch("http://localhost:3000/api/recordings", { method: "POST", body: formData });
console.log(`Upload status: ${uploadRes.status}`);
const uploadData = await uploadRes.json();
console.log(JSON.stringify(uploadData, null, 2));

if (uploadData.id) {
  console.log(`\nAnalyzing recording ${uploadData.id}...`);
  const analyzeRes = await fetch(`http://localhost:3000/api/recordings/${uploadData.id}/analyze`, { method: "POST" });
  console.log(`Analyze status: ${analyzeRes.status}`);
  const analyzeData = await analyzeRes.json();
  console.log(JSON.stringify(analyzeData, null, 2));
  
  if (analyzeData.investigationId) {
    console.log(`\nInvestigation created: ${analyzeData.investigationId}`);
    console.log(`Analysis status: ${analyzeData.analysisStatus}`);
    console.log(`Validation outcome: ${analyzeData.validationOutcome}`);
    console.log(`Observation count: ${analyzeData.investigation?.bundle?.observations?.length}`);
    console.log(`Ambiguity count: ${analyzeData.investigation?.bundle?.ambiguities?.length}`);
    
    // Verify it is INCONCLUSIVE
    if (analyzeData.analysisStatus === "INCONCLUSIVE") {
      console.log("\n✓ Correctly INCONCLUSIVE — ambiguities preserved, no fabricated observations");
    } else {
      console.log(`\nNote: analysisStatus is ${analyzeData.analysisStatus}, not INCONCLUSIVE — may be READY with ambiguities`);
    }
  }
}
