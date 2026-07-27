import { NextRequest, NextResponse } from "next/server";

// 古いiframeやブラウザキャッシュがリネーム前のURLを要求しても、画像を欠損させない。
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/images/features/bid-research-ai.png", request.url),
    308,
  );
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
