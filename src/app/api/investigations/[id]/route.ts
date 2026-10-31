import { NextRequest, NextResponse } from "next/server";
import { getInvestigation, getSpec } from "@/lib/investigations/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getInvestigation(id);
  if (!record) {
    return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
  }
  const spec = getSpec(id);
  return NextResponse.json({ investigation: record, spec });
}
