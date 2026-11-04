# Vision model setup

ReplaySpec sends selected recording frames to a server-side vision model only when `REPLAYSPEC_LIVE_ANALYSIS=true`. Provider credentials are never returned by the status endpoint or sent to the browser.

## Recommended: OpenRouter free router

The project is configured to use OpenRouter's `openrouter/free` router. It selects an available free model that supports the request's capabilities, including image input for this app. The routed model may change and is not guaranteed to be a Meta model. Meta Muse Spark Open is a separate paid listing and is not used by this configuration.

Add the following to the project-root `.env.local` file:

```env
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key_here
REPLAYSPEC_LIVE_ANALYSIS=true
```

Keep the key private. Do not put it in `.env.example`, source code, or a `NEXT_PUBLIC_` variable. Restart the development server after changing environment values. The provider route caps each analysis at three frames to limit request size. OpenRouter's free usage is rate-limited; its current free-account limits and eligibility rules can change, and rejected/rate-limited attempts may still count toward limits. The `openrouter/free` route is intended to select a $0 model; do not replace it with a paid model ID if you need to stay on the free route.

## Groq fallback

To switch back to Groq, use a Groq API key and set:

```env
MODEL_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
REPLAYSPEC_LIVE_ANALYSIS=true
```

Groq's free plan has account-specific request and token limits. Check that the account remains on Free; its Developer usage is billed by tokens.

## Provider configuration

| Provider ID | Server key | Default model in this app |
|---|---|---|
| `openrouter` | `OPENROUTER_API_KEY` | `openrouter/free` |
| `groq` | `GROQ_API_KEY` | `qwen/qwen3.8-27b` |
| `baseten` | `BASETEN_API_KEY` (or legacy `MUSE_API_KEY`) | `meta-models/muse-spark-open` |
| `together` | `TOGETHER_API_KEY` | `meta-models/Muse-Spark-Open-816B-A42B` |
| `fireworks` | `FIREWORKS_API_KEY` | `accounts/fireworks/models/muse-spark-open` |
| `cloudflare` | `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | `meta/muse-spark-open` |

The key-present status only confirms local configuration. A successful provider request confirms that the account can access a route at that moment; free model availability and quotas remain provider-controlled.

## References

- [OpenRouter free models](https://openrouter.ai/collections/free-models/)
- [OpenRouter `openrouter/free` model page](https://openrouter.ai/openrouter/free)
- [OpenRouter rate limits](https://openrouter.ai/docs/api-reference/limits)
- [Meta Muse Spark Open listing and pricing](https://openrouter.ai/meta/muse-spark-open)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)
