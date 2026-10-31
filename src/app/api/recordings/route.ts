import { NextRequest, NextResponse } from "next/server";
import { saveRecording, listRecordings } from "@/lib/recordings/store";

export async function GET() {
  const recordings = listRecordings();
  return NextResponse.json({ recordings });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const expectedBehaviour = formData.get("expectedBehaviour") as string | null;
    const context = formData.get("context") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file is actually a File object
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = saveRecording(
      {
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
      },
      {
        title: title ?? "",
        expectedBehaviour: expectedBehaviour ?? "",
        context: context ?? undefined,
      }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ recording: result.meta, id: result.id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}
