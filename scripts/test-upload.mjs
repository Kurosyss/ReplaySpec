import fs from "node:fs";
import path from "node:path";

const recordingPath = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-9f930-alidation-error-with-video--chromium/video.webm";
if (!fs.existsSync(recordingPath)) {
  console.log("Recording not found, trying alternative");
  const alt = "test-results/artifacts/e2e-bug-01.video-BUG-01-vi-de647-submission-flow-with-video--chromium/video.webm";
  if (fs.existsSync(alt)) {
    console.log("Using alt:", alt);
  } else {
    console.log("No recording found");
    process.exit(1);
  }
}

const buffer = fs.readFileSync(recordingPath);
console.log(`File: ${recordingPath}, size: ${buffer.length}, type: video/webm`);

const formData = new FormData();
formData.append("file", new Blob([buffer], { type: "video/webm" }), "test-recording.webm");
formData.append("title", "Test Upload — Checkout validation");
formData.append("expectedBehaviour", 'Submitting without postal code must display "Postal code is required."');
formData.append("context", "Test context for M3.4 intake");

const res = await fetch("http://localhost:3000/api/recordings", {
  method: "POST",
  body: formData,
});

console.log(`Upload status: ${res.status}`);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));

if (data.id) {
  console.log(`Recording created: ${data.id}`);
  // Now try to analyze
  const analyzeRes = await fetch(`http://localhost:3000/api/recordings/${data.id}/analyze`, {
    method: "POST",
  });
  console.log(`Analyze status: ${analyzeRes.status}`);
  const analyzeData = await analyzeRes.json();
  console.log(JSON.stringify(analyzeData, null, 2));
}
