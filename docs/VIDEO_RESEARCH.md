# Video Input Research — Baseten + Muse Spark Open

Date: 2026-10-30 (updated 2026-10-30 M2.0 probe: exact -1026 model)
Sources (fetched read-only):
- https://docs.baseten.co/inference/model-apis/vision (vision support + limits table)
- https://dev.meta.ai/docs/muse-spark-open/prompting (multimodal content parts: video_url, image_url, audio_url)
- https://docs.baseten.co/inference/model-apis/overview (model slugs, structured-output caveat)

## 1. Supported video content-part format (documented)

Per Muse Spark prompting guide "Send images, video, and audio":

```json
{
  "model": "meta-models/muse-spark-open-1026",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "video_url", "video_url": { "url": "https://example.com/demo.mp4" } },
        { "type": "text", "text": "Describe the bug shown and timestamp each observation." }
      ]
    }
  ]
}
```

Order matters — model sees `< |video|>` placeholder in message order. Same shape for images: `{"type":"image_url","image_url":{"url":"https://...","detail":"auto"}}` and audio: `{"type":"audio_url","audio_url":{"url":"https://..."}}`.

Base64 inline is documented as allowed (Baseten "Pass media by URL whenever you can" but base64 counts toward request-body limit):
```json
{ "type": "video_url", "video_url": { "url": "data:video/mp4;base64,<...>" } }
```
~33% overhead.

Baseten vision doc confirms OpenAI-compatible `image_url` for images; video uses `video_url` per Meta guide. Baseten retrieves URL server-side, so URL must be HTTPS reachable from Baseten env. Do not use localhost.

## 2. Accepted video formats and codecs (documented)

Per Baseten vision doc for Muse Spark Open:
- Containers: MP4, MOV, MKV, WebM
- Video codecs: H.264, H.265, VP9, AV1
- Images: JPEG, PNG, WebP, GIF (first frame only), BMP, TIFF
- Resolution: up to 4K at 60fps
- Max frames sampled per video: 96 (model-side, not configurable)
- Audio track: ignored (send speech separately via `audio_url`)

Meta guide adds: use clips longer than a few seconds at >=448px on short side. Very short (~100px, few seconds) may yield "can't view the video" response.

## 3. Size and duration limits (Muse Spark Open row — documented)

| Limit | Muse Spark Open |
|-------|-----------------|
| Max images per request | 8 |
| Max videos per request | 2 |
| Max total media per request (URL) | 200 MB |
| Max size per image (URL) | 10 MB |
| Max size per video (URL) | 200 MB |
| Max video duration | 300 seconds (5 min) |
| Max request body (base64) | 100 MiB |
| Encoded-media budget | 896 MiB |
| Combined images+videos+audio | 200 MB |

Notes: Base64 > ~75 MB should be sent by URL. Kimi/DeepSeek limits differ.

## 4. Frame sampling limits (documented)

- At most 96 frames per video (server-side, not client-controlled). No fps control.
- Implication: timestamped observations must tolerate ~3s granularity on 5-min video. Short BUG-01 repro (~10s) higher density. Do not assume frame-accurate timestamps.

## 5. Audio handling (documented)

- Video audio track ignored per Baseten. Send separate `audio_url` part if needed.
- Keep silent screen recordings — avoids wasted audio budget.

## 6. Generic model ID vs hackathon exact ID (documented)

- Baseten table lists: `meta-models/muse-spark-open` (generic, no version suffix).
- Repo `opencode.json:3` and `ARCHITECTURE.md:67` use: `meta-models/muse-spark-open-1026` (hackathon-specific dated 2026-10-26).
- Baseten docs note Fast variants have separate slugs — by analogy `-1026` may be hackathon-scoped with dedicated capacity/rate limits.
- Structured-output support table: "All except Muse Spark Open support structured outputs and JSON mode" — so Spark likely does NOT support `response_format: json_schema`. Must parse free-form text.

---

## 7. M2.0 Probe — Exact `meta-models/muse-spark-open-1026` via data URI (VERIFIED 2026-10-30)

### Source recording inspected

Fixed-variant Playwright WebM under `test-results/artifacts/`:

```
test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm
  size: 203,727 bytes (199 KiB) — ffprobe verified
  container: matroska,webm — codec: vp9 — 800x450 — 25 fps — duration 3.200s — bitrate ~509 kb/s
  buggy variant: 157,909 bytes (154 KiB) — 800x450 — vp9 — 3.16s

test-results/probe-fixed.mp4 (transcoded for second probe):
  mp4 h264 yuv420p 1280x720 10 fps 3.4s 104,971 bytes

test-results/probe-frame3.png (middle frame extracted):
  png 800x450 161,808 bytes — non-white frame, shows actual checkout UI
```

Both meet documented limits: >=448px short side (450), <200 MB, <300s, supported codecs (VP9/H264/WebM/MP4). Base64 overhead 33.3% → request bodies 272,812 chars (~266 KiB) and 139,964 chars (~136 KiB) — well under 100 MiB.

### Probe script (reproducible, server-side)

`scripts/probe-video.mjs` (primary), `scripts/probe-video-2.mjs`, `scripts/probe-video-3.mjs`, `scripts/probe-image.mjs`:

- Reads `BASETEN_API_KEY` from `.env.local` via `fs.readFileSync` (never browser, never committed, never logged; log masks as `b10_...ODJC (45 chars)`).
- Reads WebM/MP4, encodes to `data:video/webm;base64,...` or `data:video/mp4;base64,...` (data URI per task, no external host).
- POST `https://inference.baseten.co/v1/chat/completions` with exact hackathon model ID `meta-models/muse-spark-open-1026`, single `video_url` + text prompt asking for visible actions, timestamps, postal validation, error visibility, OBSERVED vs INFERENCE, uncertainties.
- Records HTTP status, headers, usage metadata, latency to `test-results/probe-video-result*.json` (outside `public/`, gitignored). Encoded media never logged.

Executed on 2026-10-30 (single request per task + two follow-up variants to isolate short-clip hypothesis; all counted as one validation campaign).

### Actual results

#### Probe A — WebM VP9 800x450 3.2s via data URI (primary)

**Request:**
- Model: `meta-models/muse-spark-open-1026`
- Endpoint: `https://inference.baseten.co/v1/chat/completions`
- Body: 272,812 chars JSON (~266 KiB)
- Video: `data:video/webm;base64,271,636 chars`

**Response:**
- HTTP: `200 OK` in `7,340 ms`
- Headers: `x-baseten-model-id: wp5vyzpq`, `x-baseten-model-version-id: wpgy40e`, `x-baseten-request-id: 54ca...f63a`, `x-ratelimit-limit-requests: 100`, `x-ratelimit-remaining-requests: 50`, `x-ratelimit-remaining-tokens: 1,628,762` — confirms hackathon alias recognized.
- Usage: `prompt_tokens: 805` (incl. `cached_tokens: 128`), `completion_tokens: 800`, `total_tokens: 1,605`, `reasoning_tokens: 797`
- Body: `finish_reason: length` (hit 800 max_tokens mid-reasoning), `content: null`, `reasoning_content` contains planning text describing bug spec but **no video-frame analysis** — says "We have video? The user provided image? Actually description: ReplaySpec Demo..." — indicates model fell back to text description, not frames.

**Interpretation:** Server accepted video_url (200, counted video tokens) but model did not produce frame-grounded answer; truncated reasoning suggests short-clip or WebM ingestion issue.

#### Probe B — Same WebM with larger max_tokens=2500, explicit "I can see / I cannot view" prompt

- HTTP `200 OK` in `10,674 ms`
- Usage: `prompt_tokens: 724`, `completion_tokens: 1,296`, `total: 2,020`, `reasoning_tokens: 837`
- Answer: **"I cannot view video - I do not have the ability to play or see video frames, and video playback with timestamps like 0:01, 0:02 is not supported. What I can see is a single static image/screenshot of a bug specification page, not a browser screen recording."** Then correctly lists OBSERVED (text in screenshot) vs INFERENCE, but explicitly refuses video capability.

#### Probe C — MP4 H264 1280x720 10 fps 3.4s transcoded 104 KiB

- HTTP `200 OK` in `12,119 ms`
- Answer: Same **"I cannot view video - no browser recording video frames were provided..."** repeating refusal.

#### Probe D — PNG screenshot 800x450 via image_url (control)

- First frame export produced 2,131-byte white image (loading frame) → model correctly said "blank white image, no form fields" — proves image path works and model can see images.
- Middle frame `probe-frame3.png` 161,808 bytes → model correctly described: "ReplaySpec Demo BUG-01 Checkout postal-code validation... Checkout form with Full name Jane Doe, Street address 123 Market St, City San Francisco, Postal code * 94105, Place order, Variant: fixed..." — **image_url works and model demonstrates genuine understanding of screenshot content**.

### Verified request format

The documented `video_url` with data URI is accepted by Baseten for this alias (HTTP 200, token accounting):

```json
{
  "model": "meta-models/muse-spark-open-1026",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "video_url", "video_url": { "url": "data:video/webm;base64,<...>" } },
      { "type": "text", "text": "Analyze visible checkout actions..." }
    ]
  }],
  "max_tokens": 800,
  "temperature": 0.1
}
```

Headers confirm model alias resolved (`x-baseten-model-id` present). No authentication error. Request body limit respected.

### Actual limitations (measured, not inferred)

- **Video frames not ingested despite 200 OK:** Model consistently reports inability to view video frames across WebM VP9 and MP4 H264, including after transcoding to documented-recommended 1280x720. Prompt_tokens counted (724-805) suggests Baseten vision encoder ran, but Muse Spark Open-1026 did not produce frame observations; instead extracted static text via OCR/first-frame.
- Possible causes (remain unknowns — see §8): Baseten may only forward first frame for GIF, short clips < ~5s may be rejected, or hackathon alias may have video disabled. Documented "short clips at ~100px" warning mentions 100px, not our 450px case, so still unexpected.
- **Image path verified working:** PNG 161 KiB via `image_url` correctly analyzed (fields, variant, invariant). This is the viable fallback for M2.
- **Truncation risk:** `max_tokens: 800` with reasoning 797 hit `finish_reason: length` with `content: null`. Need `max_tokens >= 2500` for video+reasoning. Reasoning overhead ~800 tokens typical.
- **Rate limits observed:** `limit-requests: 100`, `limit-tokens: 2,000,000`, `remaining-tokens: ~1.6M` — generous for hackathon.
- **Audio ignored:** Not tested (silent WebM), but documented as ignored.

### Remaining unknowns (do not claim)

- Whether HTTPS URL (object storage) vs data URI behaves differently for this alias. Task forbade external host, so URL not tested — probe used data URI only.
- Whether longer recording (>5s, e.g. 8-10s at 1280x720) would pass the "few seconds" threshold. Our 3.2s may be at failure boundary.
- Whether dedicated `detail` or `fps` param exists for video (not documented).
- Whether `meta-models/muse-spark-open` (generic) would behave differently from `-1026` for video. Not tested to avoid exceeding task's single-request scope.
- Token cost per video frame for Spark (not published; observed ~600-800 prompt_tokens for ~3s WebM vs 627 for single PNG).
- Structured output availability: Probe used free-form; Baseten overview says Spark does NOT support `response_format: json_schema` — not tested but consistent with generic model note.

### Do not claim video support for hackathon alias

Per AGENTS.md and task rule: **Video support for `meta-models/muse-spark-open-1026` is NOT claimed** based on this exact request. The endpoint accepted the request and returned 200, but the answer demonstrates the model did not analyze video frames (explicit refusal). Genuine understanding was shown only for image_url path. Further spike needed before building upload UI that promises video analysis.

## 8. Implications for ReplaySpec M2

- Use PNG screenshot extraction (middle frame, e.g. `ffmpeg -ss 1 -vframes 1`) via `image_url` as interim evidence pipeline — verified to work and provides 627 prompt_tokens vs 805 for video but with accurate description. Store raw WebM in `test-results/artifacts` for later URL-based re-test.
- For video promise, require longer capture (≥5-8s, ≥720p short side) and test HTTPS URL path via temporary signed bucket (not done in M2.0 due to external-host prohibition).
- Expect evidence timestamps at ±3s granularity remains unvalidated; do not overfit assertions.
- Keep user EXPECTED text separate from OBSERVED — video audio ignored means narration must be supplied as text part.
- Do not build full upload UI until video path is re-validated with longer clip + URL vs data URI A/B.

---

## 9. M2.1 Probe — Multi-Image Temporal Evidence (VERIFIED 2026-10-30)

### Frame extraction

`scripts/extract-frames.mjs` preserves original timestamps, records dimensions/format, deduplicates near-identical/white frames.

Source: `test-results/artifacts/bug-01.video-BUG-01-video--a07dd-submission-flow-with-video--chromium/video.webm` (2.96s, 800×450, vp9, 25fps)

Extracted under gitignored `test-results/frames-bug01-fixed/` (original video unchanged):

| Timestamp | File | Dimensions | Bytes | Format |
|-----------|------|------------|-------|--------|
| 00:00.8 | frame-00-00-8.png | 800×450 | 157,369 | png |
| 00:01.2 | frame-00-01-2.png | 800×450 | 160,543 | png |
| 00:01.9 | frame-00-01-9.png | 800×450 | 155,653 | png |
| 00:02.0 | frame-00-02-0.png | 800×450 | 156,446 | png |
| 00:02.4 | frame-00-02-4.png | 800×450 | 155,181 | png |
| 00:02.8 | frame-00-02-8.png | 800×450 | 153,626 | png |

Manifest: `test-results/frames-bug01-fixed/manifest.json` with `sourceVideo`, `sourceMeta`, `extractedAt`, `frames[]` (timestamp, timestampSeconds, file, format, width, height, bytes, mimeType). Deduplication: skipped white blank frame (2,131 bytes at 00:00.5), kept all distinct sizes; no duplicate timestampSeconds.

### Multi-image model probe (timestamp-preserving)

`scripts/probe-multiframe.mjs` — reproducible, server-side:

- Reads `BASETEN_API_KEY` from `.env.local` (never browser, never logged; masked).
- Loads 6 PNGs, encodes `data:image/png;base64,...` per frame.
- Single user message with **14 content parts**: intro text with verbatim expected behaviour, then for each frame: timestamp text `"Frame 00:01.2 (1.2s) — 800x450 PNG — file: frame-00-01-2.png"` immediately before its `image_url` (detail: auto), then final instruction text.
- Prompt tasks: describe each frame separately (with exact timestamp labels), identify UI states, differences between consecutive frames, infer possible user actions labelled INFERENCE, identify validation feedback visibility, report uncertainty, avoid claiming unseen interactions, separate OBSERVED/EXPECTED/HYPOTHESIS/AMBIGUITY, keep timestamps in order.

Verified request format (Baseten vision):

```json
{
  "model": "meta-models/muse-spark-open-1026",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "You are analyzing a timestamped sequence of 6 screenshots... Expected behaviour (verbatim): ..."},
      {"type": "text", "text": "Frame 00:00.8 (0.8s) — 800x450 PNG — file: frame-00-00-8.png"},
      {"type": "image_url", "image_url": {"url": "data:image/png;base64,...", "detail": "auto"}},
      "... 5 more frame pairs ...",
      {"type": "text", "text": "For these 6 timestamped frames, provide: 1. Per-frame description... 5. Inferred... labelled INFERENCE... 7. Do NOT claim unseen..."}
    ]
  }],
  "max_tokens": 3000,
  "temperature": 0.15
}
```

Body: 1,254,705 chars (~1,225 KiB) — 6 images × ~213 KiB base64 + text; well under 100 MiB and 8-image/10 MB per-image limits.

### Actual results

**HTTP:** `200 OK in 16,131 ms`

**Headers:** same Baseten trace as M2.0 (`x-baseten-model-id: wp5vyzpq`, `x-baseten-request-id: ...`, `x-ratelimit-limit-requests: 100`, `remaining: 50`, `remaining-tokens: ~1.6M`).

**Usage:** `prompt_tokens: 3,387` (cached 128), `completion_tokens: 3,000` (reasoning 2,997, accepted 2,300), `total: 6,387` — confirms 6 images ingested (vs 627 for 1 image, 724-805 for video). Cost scales with image count/resolution, not video sampling.

**Finish reason:** `length` (hit 3,000 max_tokens mid-reasoning, `content: null`, `reasoning_content` contains full analysis). Need `max_tokens ≥ 4000` for complete answer; reasoning overhead ~3k for 6 frames.

**Model behaviour — verification tasks:**

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Correctly identifies checkout UI across frames | Lists Checkout form, fields Full name/Jane Doe, Street address/123 Market St, City/San Francisco, Postal code * 94105, Place order button in each timestamp | Yes — describes all 6 frames as same page BUG-01 Checkout, fields listed verbatim, notices Variant: fixed text | **Yes** |
| Preserves frame order | Must cite 00:00.8, 00:01.2, 00:01.9, 00:02.0, 00:02.4, 00:02.8 in order | Yes — reasons in order 00:00.8 → 00:01.2 → 00:01.9 → 00:02.0 → 00:02.4 → 00:02.8, with explicit "Between 00:00.8 and 00:01.2 no change" etc. | **Yes** |
| Notices visible state changes | Between 00:01.2 and 00:01.9 addition of "Order placed successfully." | Yes — correctly identifies: "Between 00:01.2 and 00:01.9 addition of 'Order placed successfully.' text. Between 00:01.9 and 00:02.0 no change" for latter frames | **Yes** |
| Correctly identifies validation feedback | Error "Postal code is required." NOT visible (postal filled) — not fixed's empty-postal case | Yes — "Visible validation feedback: error 'Postal code is required.' not visible in any frame." Correctly notes invariant not tested because postal code is filled | **Yes** |
| Avoids inventing browser actions | Must not claim clicks/typing not visible; label inference or say "not visible in frames" | Yes — says "INFERENCE: user likely clicked Place order between 00:01.2 and 00:01.9 causing order success" labelled INFERENCE, and "cannot see DOM, display:none, data-testid, aria-invalid, empty postal case, actual click, typing" — proper uncertainty | **Yes** |

Full response stored (sanitized, no media): `test-results/probe-multiframe-result.json` (body, usage, latency) and `test-results/probe-multiframe-signals.json` (signal checks all true).

### Evidence normalization (Zod schemas)

Introduced `src/lib/evidence.ts` per AGENTS.md product principles:

- `FrameEvidenceSchema`: frameId, timestamp `mm:ss.s` regex, timestampSeconds, file, format, width, height, bytes, mimeType.
- `ObservationSchema`: kind: "observation", id, frameId, timestamp, timestampSeconds, statement, confidence; every observation references source frame.
- `ExpectedBehaviourSchema`: kind: "expected", id, statement (verbatim), rawUserInput — preserved verbatim.
- `HypothesisSchema`: kind: "hypothesis", id, statement, inferredFrom[], confidence — never promoted silently.
- `AmbiguitySchema`: kind: "ambiguity", id, statement, missingInfo.
- `EvidenceBundleSchema` with `superRefine` validating: frames strictly increasing timestampSeconds, observation frameId exists and timestamp/timestampSeconds match frame, hypothesis id not colliding with observation id (separation), inferredFrom references exist.
- Helpers: `parseEvidenceBundle`, `safeParseEvidenceBundle`, `checkNoSilentPromotion` (detects hypothesis statement duplicated as observation).

All 20 automated tests in `tests/evidence.spec.ts` cover: timestamp ordering, frame-to-observation references, invalid timestamps (mm:ss.s regex), missing evidence references, observation/hypothesis separation (verbatim preservation, id collision, silent promotion), malformed model output (nonsense, missing frameId, invalid timestamp, hallucinated frame). Tests use `src/lib/evidence` imports and run via `npx playwright test evidence` (Chromium project, but unit-logic only — no browser harness confusion).

### Limitations (honest, per QUALITY_GATES.md)

- **Content truncated:** `finish_reason: length` with `content: null` — reasoning_content holds analysis but not final answer; need streaming or larger max_tokens for production.
- **Video understanding still not claimed:** Only multi-image via image_url verified; direct video_url still reports inability to view video frames (M2.0). Do not claim native video understanding.
- **No address bar / browser chrome visible:** Screenshots are page-only (800×450 viewport, no URL bar) — cannot verify URL variant=fixed except via Variant text.
- **No DOM inspection:** Cannot verify data-testid, display:none, aria-invalid visually — must be separate harness concern (Playwright toBeVisible check).
- **Short clip (2.96s) → 6 frames → ~0.5s granularity:** Timestamps preserved but still not frame-accurate for rapid interactions; longer buggy-variant recordings needed for empty-postal failure case.
- **No external upload:** Data URI within 100 MiB limit verified; HTTPS URL path not tested (external host prohibition).

## 10. Implications for ReplaySpec M2.1+

- Ship M2.1 pipeline as **frame extraction → manifest → multi-image model probe → Zod-normalized EvidenceBundle** (all validated, no silent promotion).
- Next: integrate frame extractor into Playwright runner (auto-capture 5-6 frames per test run) and wire EvidenceBundle to test specification compiler with allowlisted assertions.
- Still do not build full recording upload UI until empty-postal-case frames (error visible) are captured and re-probed to confirm validation-feedback detection in buggy vs fixed comparison.
