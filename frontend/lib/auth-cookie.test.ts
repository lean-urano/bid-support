import assert from "node:assert/strict";
import { test } from "node:test";

const expected = { httpOnly: true, sameSite: "none", secure: true, partitioned: true, path: "/" };

for (const env of ["production", "development"]) {
  test(`NODE_ENV=${env}: SameSite=None; Secure; Partitioned`, async () => {
    const original = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = env;
    try {
      const mod = await import(`./auth-cookie.ts?env=${env}`);
      assert.deepEqual(mod.authCookieOptions, expected);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = original!;
    }
  });
}
