import { NextResponse } from "next/server";
import { getModelProviderConfig } from "@/lib/muse/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getModelProviderConfig();
  if (!config.provider) {
    return NextResponse.json({
      model: "Multimodal vision model",
      provider: null,
      configured: false,
      liveAnalysisEnabled: false,
      message: `Unknown MODEL_PROVIDER: ${config.invalidProvider}`,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({
    model: config.model,
    provider: config.label,
    providerId: config.provider,
    modelId: config.model,
    configured: config.configured,
    liveAnalysisEnabled: config.liveAnalysisEnabled,
    credential: config.credential,
    pricingUrl: config.pricingUrl,
    usageNote: config.usageNote,
    message: config.configured
      ? "Provider credentials are configured. A successful analysis request is still required to verify access."
      : `${config.credential} is not configured for ${config.label}. Add it to the server environment to enable live analysis.`,
  }, { headers: { "Cache-Control": "no-store" } });
}
