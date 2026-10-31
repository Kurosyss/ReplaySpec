import { NextRequest, NextResponse } from "next/server";
import { getRunResult } from "@/lib/runs/runner";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = getRunResult(id);
  if (!result) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
