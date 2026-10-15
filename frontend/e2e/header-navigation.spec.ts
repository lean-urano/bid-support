import { createHmac } from "node:crypto";
import path from "node:path";
import { test, expect } from "@playwright/test";

// ヘッダーの検証用に有効な認証セッションを用意する。認証APIはテスト対象外。
for (const role of ["user", "admin"] as const) {
  for (const width of [1280, 390]) {
    test(`${role}: ${width}pxでナビを表示せず既存の操作を保つ`, async ({ page, context, baseURL }) => {
      const user = { sub: `header-test:${role}`, name: "ヘッダー確認", email: "header-test@example.com", role };
      const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + 60_000 })).toString("base64url");
      const secret = process.env.AUTH_SESSION_SECRET ?? "bid-support-development-session-secret";
      const signature = createHmac("sha256", secret).update(payload).digest("base64url");
      await context.addCookies([{ name: "bid_support_session_chips", value: `${payload}.${signature}`, url: baseURL! }]);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("banner")).toBeVisible();
      const header = page.getByRole("banner");
      await expect(header.getByRole("link", { name: /公共工事サポート|管理者ホーム/ })).toBeVisible();
      await expect.soft(header.getByRole("link", { name: /案件調査AI|調査AI管理/, includeHidden: true })).toHaveCount(0);
      await expect.soft(header.getByRole("link", { name: /交渉AI/, includeHidden: true })).toHaveCount(0);
      await expect(header.getByRole("button", { name: "メニューを開く", exact: true })).toHaveCount(0);

      if (role === "user") {
        await header.getByTitle("通知一覧").click();
        await expect(header.getByText("お知らせ・通知一覧")).toBeVisible();
        await header.getByTitle("通知一覧").click();
        await header.getByTitle("プロフィールメニュー").click();
        await expect(header.getByRole("menuitem", { name: "ログアウト", exact: true })).toBeVisible();
        await expect(header.getByText(user.email, { exact: true })).toBeVisible();
        await header.getByTitle("プロフィールメニュー").click();
      } else {
        await expect(header.getByRole("button", { name: "ログアウト", exact: true })).toBeVisible();
        await expect(header.getByText("管理コンソール", { exact: true })).toBeVisible();
      }
      // トップページのカードによる導線は維持する。
      await expect(page.locator('main a[href="/bids"]')).toBeVisible();
      await expect(page.locator('main a[href="/contractors"]')).toBeVisible();
      // カードの枠だけでは画像の読み込み成功を証明できない。
      const thumbnails = page.locator("main img");
      await expect(thumbnails).toHaveCount(2);
      for (const image of await thumbnails.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0
        ), { timeout: 10_000 }).toBe(true);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      if (process.env.HEADER_SCREENSHOT_DIR) {
        await page.screenshot({ path: path.join(process.env.HEADER_SCREENSHOT_DIR, `${role}-${width}.png`), fullPage: true });
      }
    });
  }
}
