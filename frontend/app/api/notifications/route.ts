import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const initialSeedNotifications = [
  {
    userId: "all",
    title: "AI高評価案件の検出",
    message: "自社実績と高相性(95点)の「○○市民ホール改修」が登録されました。",
    type: "ai",
    linkUrl: "tender:1",
    read: false,
  },
  {
    userId: "all",
    title: "自治体スクレイピング完了",
    message: "東京都・神奈川県の最新入札案件 12件を自動収集しました。",
    type: "scraping",
    linkUrl: "admin:scraping",
    read: false,
  },
  {
    userId: "all",
    title: "NJSS CSVインポート成功",
    message: "新着のNJSS案件データ 45件の取り込みが完了しました。",
    type: "system",
    linkUrl: "admin:scraping",
    read: true,
  },
];

// GET: 通知一覧の取得（空の場合は初期データをシード保存）
export async function GET() {
  try {
    let notifications = await prisma.notification.findMany({
      orderBy: { id: "desc" },
    });

    if (notifications.length === 0) {
      await prisma.notification.createMany({
        data: initialSeedNotifications,
      });
      notifications = await prisma.notification.findMany({
        orderBy: { id: "desc" },
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST: 全通知を一括既読にする
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "read-all") {
      await prisma.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      const updated = await prisma.notification.findMany({
        orderBy: { id: "desc" },
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
