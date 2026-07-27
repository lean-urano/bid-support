import { test, expect } from "@playwright/test";

// 一般ユーザー: sso/idpの開発用デモアカウント(backend/seed.pyでrole=userを事前登録)
const USER_EMAIL = process.env.E2E_SSO_USER_EMAIL ?? "alice@example.com";
const USER_PASSWORD = process.env.E2E_SSO_USER_PASSWORD ?? "alicepass";

// 管理者: MIRROR SSOを使わずメール・パスワードでログインする専用アカウント(backend/seed.py)
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@bid-support.jp";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin1234";

async function loginAsUserViaMirrorSso(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForURL(/\/login$/);
  await page.getByLabel("メールアドレス").fill(USER_EMAIL);
  await page.getByLabel("パスワード").fill(USER_PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
}

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("メールアドレス").fill(ADMIN_EMAIL);
  await page.getByLabel("パスワード").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "ログインする" }).click();
}

test.describe("認証", () => {
  test("未ログインでアクセスするとMIRRORのログイン画面へリダイレクトされる", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "MIRRORアカウントにログイン" })).toBeVisible();
  });

  test("一般ユーザーはMIRROR SSOでログインでき、管理者UIは表示されない", async ({ page }) => {
    await loginAsUserViaMirrorSso(page);

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    await expect(page.getByText("管理者ダッシュボード")).not.toBeVisible();
  });

  test("管理者はメール・パスワードでログインすると管理者ダッシュボードが表示される", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    await expect(page.getByText("管理者ダッシュボード")).toBeVisible();
    await expect(page.getByText("システム管理者権限でログイン中")).toBeVisible();
  });

  test("管理者アカウントでもパスワードが違えばログインできない", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("メールアドレス").fill(ADMIN_EMAIL);
    await page.getByLabel("パスワード").fill("wrong-password");
    await page.getByRole("button", { name: "ログインする" }).click();

    await expect(page.getByText("メールアドレスまたはパスワードが違います")).toBeVisible();
  });

  test("管理者がログアウトするとSSOを経由せず管理者ログイン画面に戻る", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("管理者ダッシュボード")).toBeVisible();

    await page.getByTitle("ログアウト").click();

    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("一般ユーザーがログアウトするとMIRRORのセッションも破棄される", async ({ page }) => {
    await loginAsUserViaMirrorSso(page);

    await page.getByTitle("ログアウト").click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "MIRRORでログイン" })).toBeVisible();

    // MIRROR側のセッションも破棄されているため、再度ログインしようとすると
    // 自動サインインではなくメール・パスワード入力画面が出るはず
    await page.getByRole("button", { name: "MIRRORでログイン" }).click();
    await page.waitForURL(/\/login$/);
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
  });
});
