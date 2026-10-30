# Video Input Research — Baseten + Muse Spark Open

Date: 2026-10-30
Sources (fetched read-only):
- https://docs.baseten.co/inference/model-apis/vision (vision support + limits table)
- https://dev.meta.ai/docs/muse-spark-open/prompting (multimodal content parts, video guidance)
- https://docs.baseten.co/inference/model-apis/overview (model slugs, general behavior)

Do not claim hackathon endpoint tested — see "Unverified" section.

## 1. Supported video content-part format

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

Order matters — model sees `<|video|>` placeholder in message order. Same shape for images: `{"type":"image_url","image_url":{"url":"https://...","detail":"auto"}}` and audio: `{"type":"audio_url","audio_url":{"url":"https://..."}}`.

Alternatively base64 inline (not recommended for video > ~75 MB):
```json
{ "type": "video_url", "video_url": { "url": "data:video/mp4;base64,<...>" } }
```
Counts toward 100 MiB request-body limit with ~33% base64 overhead.

Baseten vision doc confirms the same OpenAI-compatible `image_url` type for images; video uses `video_url` per Meta guide. Baseten retrieves URL server-side, so URL must be HTTPS and reachable from Baseten env (e.g. object storage). Do not use localhost or presigned URLs that expire before fetch.

## 2. Accepted video formats and codecs

Per Baseten vision doc for Muse Spark Open:

- Containers: MP4, MOV, MKV, WebM
- Video codecs: H.264, H.265, VP9, AV1
- Images: JPEG, PNG, WebP, GIF (first frame only), BMP, TIFF
- Resolution: up to 4K at 60fps
- Max frames sampled per video: 96 (model-side, not configurable)
- Audio track: ignored (send speech separately via `audio_url` part)

Meta guide adds: use clips longer than a few seconds at >=448px on short side. Very short (few seconds) or low-res (~100px) may yield "can't view the video" response.

PDF not accepted — extract text first.

## 3. Size and duration limits (Muse Spark Open row)

| Limit | Muse Spark Open |
|-------|-----------------|
| Max images per request | 8 |
| Max videos per request | 2 |
| Max total media per request (URL) | 200 MB |
| Max size per image (URL) | 10 MB |
| Max size per video (URL) | 200 MB |
| Max video duration | 300 seconds (5 min) |
| Max request body (base64) | 100 MiB |
| Encoded-media budget | 896 MiB (internal token conversion) |
| Combined images+videos+audio | 200 MB |

Notes from docs:
- Base64 files > ~75 MB should be sent by URL.
- Encoded-media budget can fail even if file sizes pass. Example given: 8 large images + 2 five-min videos + 4 five-min audio → HTTP 400. Split across requests.
- Kimi K3 and DeepSeek limits differ — do not apply to Spark.

## 4. Frame sampling limits

- At most 96 frames per video (server-side sampling, not client-controlled).
- No API to set fps or interval.
- Implication for ReplaySpec: timestamped observations must tolerate ~3 sec granularity on 5-min video (300s/96 ≈ 3.1s). For short BUG-01 repro (~10s), frame density is higher. Do not assume frame-accurate timestamps.

## 5. Audio handling

- Video audio track ignored per Baseten.
- For narration/question audio, send separate `{"type":"audio_url","audio_url":{"url":"https://..."}}` part (supported via Baseten audio API). Speech-to-text not in scope for M1.
- Keep silent screen recordings — avoids wasted audio budget.

## 6. Documented generic model ID vs hackathon exact ID

- Baseten table lists: `meta-models/muse-spark-open` (generic, no version suffix).
- Repo `opencode.json:3` and `docs/ARCHITECTURE.md:67` use: `meta-models/muse-spark-open-1026` (hackathon-specific, dated 2026-10-26).
- Both appear to map to same model class but are distinct slugs. Baseten docs note Fast variants have separate slugs/pricing — by analogy, `-1026` may be hackathon-scoped with dedicated capacity/rate limits.
- Generic ID may not resolve on hackathon endpoint and vice versa.

## 7. What remains unverified (do not claim)

- Whether `meta-models/muse-spark-open-1026` accepts `video_url` on Baseten inference endpoint (only generic `meta-models/muse-spark-open` shown in vision table).
- Whether hackathon baseURL `https://inference.baseten.co/v1` enforces same 200 MB/300s limits or has stricter hackathon quotas.
- Whether `detail` param applies to video (documented for `image_url` only).
- Whether authenticated/private URLs (presigned S3) work through Baseten fetch.
- Token cost per video frame for Spark (only Kimi K3 tile math published).
- Structured output / JSON mode for Spark: overview table says "All except Muse Spark Open support structured outputs and JSON mode" — so Spark may not support `response_format: json_schema`. Observation extraction must parse free-form text + heuristic, not rely on enforced schema.
- Reasoning strength interaction with video: `reasoning_effort` (low/medium/high/xhigh=512) always on; high values increase latency/timeout risk for video requests. Streaming recommended.

## 8. Recommended next probe (not yet executed)

```bash
curl https://inference.baseten.co/v1/chat/completions \
  -H "Authorization: Bearer $BASETEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-models/muse-spark-open-1026",
    "messages": [{
      "role":"user",
      "content":[
        {"type":"video_url","video_url":{"url":"https://huggingface.co/.../short.mp4"}},
        {"type":"text","text":"Return JSON {\"observations\":[{\"t\":\"00:02\",\"desc\":\"...\"}]} only."}
      ]
    }],
    "reasoning_effort":"medium"
  }'
```

Validate: HTTP status, frame count reflected in token usage, whether JSON mode works, and whether `muse-spark-open-1026` is recognized.

Do not hardcode this probe in app code until verified.

## 9. Implications for ReplaySpec M1

- Store raw webm from Playwright (test-results/artifacts) and later upload to HTTPS-accessible bucket for URL-based analysis — do not attempt base64 for videos > few MB.
- Preprocess to ≤200 MB, ≤300s, ≥448px short side; trim silence.
- Expect evidence timestamps at ±3s granularity; do not overfit assertion to exact ms.
- Keep user EXPECTED text separate from OBSERVED (per AGENTS.md) — video audio ignored means narration must be supplied as text part.
