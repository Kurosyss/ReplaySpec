import fs from "node:fs";

const videoPath = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-050f8--filled-control-with-video--chromium/video.webm";
const buf = fs.readFileSync(videoPath);
console.log("USING SHORT CONTROL VIDEO", videoPath, buf.length, "sig", buf.slice(0,4).toString("hex"));

const fd = new FormData();
fd.append("file", new Blob([buf], { type: "video/webm" }), "inconclusive-short.webm");
fd.append("title", "INCONCLUSIVE — valid 94105 populated, no empty case");
fd.append("expectedBehaviour", 'Submitting without postal code must display "Postal code is required."');
fd.append("context", "Control: postal 94105 remains populated, success flow, expected empty-postal validation not observable — should be INCONCLUSIVE");

const r = await fetch("http://localhost:3000/api/recordings", { method: "POST", body: fd });
console.log("upload", r.status);
const j = await r.json();
console.log(JSON.stringify(j, null, 2));

if (j.id) {
  const a = await fetch(`http://localhost:3000/api/recordings/${j.id}/analyze`, { method: "POST" });
  console.log("analyze", a.status);
  const aj = await a.json();
  console.log(JSON.stringify(aj, null, 2).slice(0, 6000));
  if (aj.analysisStatus) console.log("ANALYSIS_STATUS:", aj.analysisStatus);
}
