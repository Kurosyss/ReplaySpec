import { NextRequest, NextResponse } from "next/server";
import { getRecording, deleteRecording, isValidRecordingId } from "@/lib/recordings/store";
import fs from "node:fs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidRecordingId(id)) {
    return NextResponse.json({ error: "Invalid recording ID" }, { status: 400 });
  }
  const recording = getRecording(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }
  return NextResponse.json({ recording });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidRecordingId(id)) {
    return NextResponse.json({ error: "Invalid recording ID" }, { status: 400 });
  }
  const result = deleteRecording(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

// Do not expose raw video via public static serving - this endpoint is for metadata only
// Actual video file is only accessible via frame extraction, not direct download
