import * as client from "openid-client";

const issuerUrl = process.env.OIDC_ISSUER_URL ?? "http://localhost:4000";
const clientId = process.env.OIDC_CLIENT_ID ?? "tender-support";
const clientSecret = process.env.OIDC_CLIENT_SECRET ?? "tender-support-dev-secret";

let configuration: Promise<client.Configuration> | undefined;

export function getOidcConfiguration() {
  configuration ??= client
    .discovery(new URL(issuerUrl), clientId, clientSecret, undefined, {
      execute: issuerUrl.startsWith("http://localhost") ? [client.allowInsecureRequests] : undefined,
    })
    .catch((error) => {
      configuration = undefined;
      throw error;
    });
  return configuration;
}

export const redirectUri = process.env.OIDC_REDIRECT_URI ?? "http://localhost:3000/api/auth/callback";
export { client };
