import { NextRequest, NextResponse } from "next/server";
import { requireAuth, jsonResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const fileId = req.nextUrl.searchParams.get("file_id");
  if (!fileId) {
    return jsonResponse({ error: "file_id required" }, { status: 400 });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    return jsonResponse({ error: "BOT_TOKEN not configured" }, { status: 500 });
  }

  // Get file path from Telegram
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    return jsonResponse({ error: "File not found" }, { status: 404 });
  }

  // Proxy the actual image
  const imageRes = await fetch(`https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`);
  const imageBuffer = await imageRes.arrayBuffer();
  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(imageBuffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400",
    },
  });
}
