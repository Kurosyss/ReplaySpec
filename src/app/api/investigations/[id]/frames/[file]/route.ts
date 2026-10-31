import { NextRequest, NextResponse } from "next/server";
import { getFramePath } from "@/lib/investigations/store";
import fs from "node:fs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const fullPath = getFramePath(id, file);
  if (!fullPath) {
    return NextResponse.json({ error: "Frame not found or path traversal rejected" }, { status: 404 });
  }
  try {
    const data = fs.readFileSync(fullPath);
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    let contentType = "image/png";
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
    else if (ext === "webp") contentType = "image/webp";
    else if (ext === "png") contentType = "image/png";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read frame" }, { status: 500 });
  }
}
