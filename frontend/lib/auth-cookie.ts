// Previewのiframe(別サイトに埋め込み)でもCookieを保存できるよう、
// 開発・本番とも SameSite=None; Secure; Partitioned を使う。
// localhost / 127.0.0.1 はブラウザがセキュアコンテキスト扱いするため、HTTPでもSecureが使える。
// SameSite=Noneでも同一サイト要求は従来どおり送信される。
export const authCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  partitioned: true,
  path: "/",
};
