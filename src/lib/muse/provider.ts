export const MODEL_PROVIDERS = {
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "qwen/qwen3.8-27b",
    credential: "GROQ_API_KEY",
    pricingUrl: "https://console.groq.com/docs/rate-limits",
    maxImages: 3,
    usageNote: "Groq Free plan has request and token limits. Check that the account remains on Free; Developer usage is billed by tokens.",
  },
  baseten: {
    label: "Baseten",
    baseUrl: "https://inference.baseten.co/v1",
    model: "meta-models/muse-spark-open",
    credential: "BASETEN_API_KEY",
    pricingUrl: "https://www.baseten.co/pricing/",
    maxImages: 6,
    usageNote: "Muse Spark Open access and paid usage depend on the provider account.",
  },
  openrouter: {
    label: "Meta Llama 4 Maverick (OpenRouter)",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-4-maverick",
    credential: "OPENROUTER_API_KEY",
    pricingUrl: "https://openrouter.ai/meta-llama/llama-4-maverick",
    maxImages: 3,
    usageNote: "Meta Llama 4 Maverick accepts text and images. OpenRouter routes to available providers; inference is paid and provider rates apply.",
  },
  together: {
    label: "Together AI",
    baseUrl: "https://api.together.ai/v1",
    model: "meta-models/Muse-Spark-Open-816B-A42B",
    credential: "TOGETHER_API_KEY",
    pricingUrl: "https://www.together.ai/models/muse-spark-open",
    maxImages: 6,
    usageNote: "Model access, availability, and billing depend on the provider account.",
  },
  fireworks: {
    label: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/muse-spark-open",
    credential: "FIREWORKS_API_KEY",
    pricingUrl: "https://fireworks.ai/models/fireworks/muse-spark-open",
    maxImages: 6,
    usageNote: "Model access, availability, and billing depend on the provider account.",
  },
  cloudflare: {
    label: "Cloudflare Workers AI",
    model: "meta/muse-spark-open",
    credential: "CLOUDFLARE_API_TOKEN",
    pricingUrl: "https://developers.cloudflare.com/ai/models/meta/muse-spark-open/",
    maxImages: 6,
    usageNote: "This third-party Muse route is not covered by the general Workers AI free allowance.",
  },
} as const;

export type ModelProviderId = keyof typeof MODEL_PROVIDERS;
type Environment = Record<string, string | undefined>;

export function getModelProviderConfig(env: Environment = process.env) {
  const providerValue = (env.MODEL_PROVIDER ?? env.MUSE_PROVIDER ?? "openrouter").trim().toLowerCase();
  if (!Object.hasOwn(MODEL_PROVIDERS, providerValue)) {
    return { provider: null, invalidProvider: providerValue, configured: false } as const;
  }

  const provider = providerValue as ModelProviderId;
  const definition = MODEL_PROVIDERS[provider];
  const cloudflareAccountId = provider === "cloudflare" ? env.CLOUDFLARE_ACCOUNT_ID?.trim() : undefined;
  const apiKey = env[definition.credential]?.trim() || (provider === "baseten" ? env.MUSE_API_KEY?.trim() : undefined);
  const baseUrl = provider === "cloudflare"
    ? cloudflareAccountId
      ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/ai/v1`
      : ""
    : "baseUrl" in definition
      ? definition.baseUrl
      : "";

  return {
    provider,
    label: definition.label,
    baseUrl,
    model: definition.model,
    maxImages: definition.maxImages,
    usageNote: definition.usageNote,
    pricingUrl: definition.pricingUrl,
    credential: definition.credential,
    apiKey: apiKey ?? "",
    configured: Boolean(apiKey && baseUrl),
    liveAnalysisEnabled: env.REPLAYSPEC_LIVE_ANALYSIS?.trim().toLowerCase() === "true",
  } as const;
}
