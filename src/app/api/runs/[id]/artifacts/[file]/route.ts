import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getArtifactPath } from "@/lib/runs/runner";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;

  const fullPath = getArtifactPath(id, file);
  if (!fullPath) {
    return NextResponse.json({ error: "Artifact not found or path traversal rejected" }, { status: 404 });
  }

  const stat = fs.statSync(fullPath);
  const data = fs.readFileSync(fullPath);

  const ext = file.split(".").pop() ?? "";
  let contentType = "application/octet-stream";
  if (ext === "png") contentType = "image/png";
  else if (ext === "webm") contentType = "video/webm";
  else if (ext === "zip") contentType = "application/zip";
  else if (ext === "mp4") contentType = "video/mp4";
  else if (ext === "json") contentType = "application/json";

  return new NextResponse(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
