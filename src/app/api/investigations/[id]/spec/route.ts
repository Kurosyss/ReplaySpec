import { NextRequest, NextResponse } from "next/server";
import { getInvestigation, getSpec, saveSpec } from "@/lib/investigations/store";
import { z } from "zod";
import { SpecAssertionSchema, validateAssertion } from "@/lib/spec/builder";
import { compileSpec, validateCompiledSource } from "@/lib/spec/compiler";
import type { SpecData } from "@/lib/investigations/types";

const AddAssertionSchema = z.object({
  observationId: z.string().min(1),
  matcher: z.enum(["toBeVisible", "toBeHidden", "toHaveText"]),
  expectedText: z.string().optional(),
  selector: z.string().optional(), // allow override, but must be allowlisted
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getInvestigation(id);
  if (!record) return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
  const spec = getSpec(id);
  return NextResponse.json({ spec: spec ?? { investigationId: id, assertions: [], compiledSource: null, updatedAt: null } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getInvestigation(id);
  if (!record) return NextResponse.json({ error: "Investigation not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle both single assertion add and full spec save
  // Check if body is { action: "add" } or { assertions: [...] }
  const isAddAction = body && typeof body === "object" && "observationId" in (body as any);

  if (isAddAction) {
    const parsed = AddAssertionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assertion", issues: parsed.error.issues }, { status: 400 });
    }

    const { observationId, matcher, expectedText, selector } = parsed.data;

    // Get existing spec
    const existingSpec = getSpec(id) ?? { investigationId: id, assertions: [], compiledSource: null, updatedAt: null };
    
    // Determine selector - default to postal-error for BUG-01, but allow override if in allowlist
    const finalSelector = selector ?? "postal-error";

    // Build raw assertion
    const obs = record.bundle.observations.find((o) => o.id === observationId);
    if (!obs) return NextResponse.json({ error: `Observation not found: ${observationId}` }, { status: 400 });

    const frame = record.bundle.frames.find((f) => f.frameId === obs.frameId);
    if (!frame) return NextResponse.json({ error: "Frame not found for observation" }, { status: 400 });

    const rawAssertion = {
      id: `assert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      selector: finalSelector,
      matcher,
      expectedText: matcher === "toHaveText" ? expectedText : undefined,
      observationId,
      frameId: obs.frameId,
      timestamp: obs.timestamp,
      timestampSeconds: obs.timestampSeconds,
      createdAt: new Date().toISOString(),
    };

    const validation = validateAssertion(rawAssertion, record.bundle, existingSpec.assertions);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error, issues: (validation as any).issues }, { status: 400 });
    }

    // Check for duplicate assertion ID (already handled, but also check for duplicate content)
    const newAssertions = [...existingSpec.assertions, validation.data];
    const compiled = compileSpec(newAssertions, id);
    const compiledCheck = validateCompiledSource(compiled);
    if (!compiledCheck.ok) {
      return NextResponse.json({ error: compiledCheck.error }, { status: 400 });
    }

    const newSpec: SpecData = {
      investigationId: id,
      assertions: newAssertions,
      compiledSource: compiled,
      updatedAt: new Date().toISOString(),
    };

    const saved = saveSpec(id, newSpec);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 500 });

    return NextResponse.json({ spec: newSpec, assertion: validation.data }, { status: 201 });
  }

  // Full spec save (for future)
  return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getInvestigation(id);
  if (!record) return NextResponse.json({ error: "Investigation not found" }, { status: 404 });

  const url = new URL(req.url);
  const assertionId = url.searchParams.get("assertionId");
  if (!assertionId) return NextResponse.json({ error: "Missing assertionId" }, { status: 400 });

  if (assertionId.includes("..") || assertionId.includes("/") || assertionId.includes("\\")) {
    return NextResponse.json({ error: "Invalid assertion ID" }, { status: 400 });
  }

  const spec = getSpec(id);
  if (!spec) return NextResponse.json({ error: "Spec not found" }, { status: 404 });

  const existing = spec.assertions.find((a) => a.id === assertionId);
  if (!existing) return NextResponse.json({ error: "Assertion not found" }, { status: 404 });

  const newAssertions = spec.assertions.filter((a) => a.id !== assertionId);
  const compiled = compileSpec(newAssertions, id);

  const newSpec: SpecData = {
    investigationId: id,
    assertions: newAssertions,
    compiledSource: newAssertions.length > 0 ? compiled : null,
    updatedAt: new Date().toISOString(),
  };

  const saved = saveSpec(id, newSpec);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 500 });

  return NextResponse.json({ spec: newSpec });
}
