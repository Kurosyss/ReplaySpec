# Vision model setup

ReplaySpec sends selected recording frames to a server-side vision model only when `REPLAYSPEC_LIVE_ANALYSIS=true`. Provider credentials are never returned by the status endpoint or sent to the browser.

## Meta Llama 4 Maverick on OpenRouter

The project uses `meta-llama/llama-4-maverick` through OpenRouter. It accepts text and images. This standard endpoint is paid; provider pricing applies. A one-image JSON request succeeded during verification at a cost of $0.00058023. Model availability and rates can change.

Add the following to the project-root `.env.local` file:

```env
MODEL_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key_here
REPLAYSPEC_LIVE_ANALYSIS=true
```

Keep the key private. Do not put it in `.env.example`, source code, or a `NEXT_PUBLIC_` variable. Restart the development server after changing environment values. The provider route caps each analysis at three frames to limit request size. Monitor usage in OpenRouter; repeated frame analysis incurs charges.

## Provider configuration

| Provider ID | Server key | Default model in this app |
|---|---|---|
| `openrouter` | `OPENROUTER_API_KEY` | `meta-llama/llama-4-maverick` |
| `baseten` | `BASETEN_API_KEY` (or legacy `MUSE_API_KEY`) | `meta-models/muse-spark-open` |
| `together` | `TOGETHER_API_KEY` | `meta-models/Muse-Spark-Open-816B-A42B` |
| `fireworks` | `FIREWORKS_API_KEY` | `accounts/fireworks/models/muse-spark-open` |
| `cloudflare` | `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | `meta/muse-spark-open` |

The key-present status only confirms local configuration. A successful provider request confirms that the account can access a route at that moment; free model availability and quotas remain provider-controlled.

## References

- [OpenRouter Meta Llama 4 Maverick](https://openrouter.ai/meta-llama/llama-4-maverick)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
